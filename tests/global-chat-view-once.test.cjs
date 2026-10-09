const assert = require("node:assert/strict");
const fs = require("node:fs");
const { afterEach, test } = require("node:test");
const path = require("node:path");
const typescript = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: path.basename(filename),
  });
  module._compile(outputText, filename);
};

const { prismaCliente } = require("../src/database/prismaCliente");
const cloudinaryService = require("../src/service/cloudinary.service");
const socket = require("../src/lib/socket");
const { GlobalChatController } = require("../src/modules/global-chat/globalChatController");
const { GlobalChatRepository } = require("../src/modules/global-chat/globalChatRepository");
const { GlobalChatUseCase } = require("../src/modules/global-chat/globalChatUseCase");

const originalMethods = {
  messageCreate: prismaCliente.globalChatMessage.create,
  messageDeleteMany: prismaCliente.globalChatMessage.deleteMany,
  messageFindMany: prismaCliente.globalChatMessage.findMany,
  messageFindUnique: prismaCliente.globalChatMessage.findUnique,
  viewCreateMany: prismaCliente.globalChatMessageView.createMany,
  uploadAuthenticatedImage: cloudinaryService.uploadAuthenticatedImage,
  deleteAuthenticatedImage: cloudinaryService.deleteAuthenticatedImage,
  emitGlobalChatEvent: socket.emitGlobalChatEvent,
};

const messages = new Map();
const views = new Map();
let emittedEvents = [];
let deletedCloudinaryImages = [];

function viewKey(messageId, userId) {
  return `${messageId}:${userId}`;
}

function createMessage(overrides = {}) {
  return {
    id: "message-1",
    type: "IMAGE",
    content: "private caption",
    image: "private-image-public-id",
    fileName: "private-image.jpg",
    format: "jpeg",
    optimizedSize: 1234,
    viewOnce: true,
    expiresAt: new Date(Date.now() + 60_000),
    deletedAt: null,
    userId: "author-id",
    replyToId: null,
    createdAt: new Date(),
    user: {
      userHashPublic: "author-public-id",
      name: "Author",
      avatar: null,
    },
    replyTo: null,
    reactions: [],
    _count: { comments: 0 },
    ...overrides,
  };
}

function messageWithViews(message, userId) {
  const messageViews = Array.from(views.entries())
    .filter(([key]) => key.startsWith(`${message.id}:`))
    .map(([key, viewedAt]) => {
      const readerId = key.slice(message.id.length + 1);
      return {
        userId: readerId,
        viewedAt,
        user: {
          userHashPublic: `${readerId}-public-id`,
          name: readerId,
          avatar: null,
        },
      };
    });

  if (userId) {
    return {
      ...message,
      views: messageViews.filter((view) => view.userId === userId),
    };
  }

  return { ...message, views: messageViews };
}

function setupMocks(seed = [createMessage()]) {
  messages.clear();
  views.clear();
  emittedEvents = [];
  deletedCloudinaryImages = [];
  for (const message of seed) messages.set(message.id, message);

  prismaCliente.globalChatMessage.findUnique = async ({ where }) => {
    const message = messages.get(where.id);
    return message ? messageWithViews(message) : null;
  };

  prismaCliente.globalChatMessage.findMany = async () =>
    Array.from(messages.values()).map((message) => messageWithViews(message));

  prismaCliente.globalChatMessageView.createMany = async ({
    data,
    skipDuplicates,
  }) => {
    assert.equal(skipDuplicates, true);
    let count = 0;
    for (const view of data) {
      const key = viewKey(view.messageId, view.userId);
      if (views.has(key)) continue;
      views.set(key, new Date());
      count += 1;
    }
    return { count };
  };

  prismaCliente.globalChatMessage.create = async ({ data }) => {
    const message = createMessage({
      ...data,
      id: "created-message",
      user: {
        userHashPublic: "author-public-id",
        name: "Author",
        avatar: null,
      },
    });
    messages.set(message.id, message);
    return messageWithViews(message);
  };

  prismaCliente.globalChatMessage.deleteMany = async ({ where }) => {
    const message = messages.get(where.id);
    if (!message || message.userId !== where.userId) return { count: 0 };
    messages.delete(where.id);
    return { count: 1 };
  };

  cloudinaryService.uploadAuthenticatedImage = async () => ({
    public_id: "private-image-public-id",
  });
  cloudinaryService.deleteAuthenticatedImage = async (publicId) => {
    deletedCloudinaryImages.push(publicId);
    return { result: "ok" };
  };
  socket.emitGlobalChatEvent = (event, payload) => {
    emittedEvents.push({ event, payload });
  };
}

afterEach(() => {
  prismaCliente.globalChatMessage.create = originalMethods.messageCreate;
  prismaCliente.globalChatMessage.deleteMany = originalMethods.messageDeleteMany;
  prismaCliente.globalChatMessage.findMany = originalMethods.messageFindMany;
  prismaCliente.globalChatMessage.findUnique = originalMethods.messageFindUnique;
  prismaCliente.globalChatMessageView.createMany = originalMethods.viewCreateMany;
  cloudinaryService.uploadAuthenticatedImage =
    originalMethods.uploadAuthenticatedImage;
  cloudinaryService.deleteAuthenticatedImage =
    originalMethods.deleteAuthenticatedImage;
  socket.emitGlobalChatEvent = originalMethods.emitGlobalChatEvent;
});

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("the author cannot open their own image and is not recorded as a reader", async () => {
  setupMocks();
  const useCase = new GlobalChatUseCase();

  await assert.rejects(
    useCase.markViewed("message-1", "author-id"),
    (error) => error.statusCode === 400,
  );

  assert.equal(views.size, 0);
});

test("another user opens once; only the HTTP response reveals the image", async () => {
  setupMocks();
  const controller = new GlobalChatController();
  const useCase = new GlobalChatUseCase();
  controller.useCase = useCase;
  const response = createResponse();

  await controller.markViewed(
    { params: { id: "message-1" }, id_client: "reader-id" },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.ok(response.body.message.imageUrl);
  assert.equal(response.body.message.fileName, "private-image.jpg");
  assert.equal(views.size, 1);
  assert.equal(emittedEvents.length, 1);
  assert.equal(emittedEvents[0].event, "global-chat:view-once-read");
  assert.deepEqual(Object.keys(emittedEvents[0].payload).sort(), [
    "messageId",
    "reader",
    "viewOnceStatus",
  ]);
  assert.equal("imageUrl" in emittedEvents[0].payload, false);
  assert.equal("content" in emittedEvents[0].payload, false);

  const history = await useCase.listMessages("reader-id");
  assert.equal(history.messages[0].imageUrl, null);
  assert.equal(history.messages[0].fileName, null);
  assert.equal(history.messages[0].viewOnceStatus, "READ");
  assert.equal(messages.has("message-1"), true);
});

test("a second opening is rejected without revealing the image or emitting an event", async () => {
  setupMocks();
  views.set(viewKey("message-1", "reader-id"), new Date());
  const controller = new GlobalChatController();
  controller.useCase = new GlobalChatUseCase();
  const response = createResponse();

  await controller.markViewed(
    { params: { id: "message-1" }, id_client: "reader-id" },
    response,
  );

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.message, "Essa imagem já foi visualizada por você");
  assert.equal("imageUrl" in response.body, false);
  assert.equal(emittedEvents.length, 0);
  assert.equal(views.size, 1);
});

test("simultaneous openings result in exactly one successful reveal", async () => {
  setupMocks();
  const useCase = new GlobalChatUseCase();

  const results = await Promise.allSettled([
    useCase.markViewed("message-1", "reader-id"),
    useCase.markViewed("message-1", "reader-id"),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejected = results.find((result) => result.status === "rejected");
  assert.equal(rejected.reason.statusCode, 409);
  assert.equal(views.size, 1);
});

test("the creation response, publication event, and history hide view-once media", async () => {
  setupMocks();
  const controller = new GlobalChatController();
  controller.useCase = new GlobalChatUseCase();
  const response = createResponse();

  await controller.create(
    {
      id_client: "author-id",
      body: { content: "private caption", viewOnce: "true" },
      file: {
        originalname: "private-image.jpg",
        mimetype: "image/jpeg",
        size: 1234,
      },
    },
    response,
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.imageUrl, null);
  assert.equal(response.body.fileName, null);
  assert.equal(response.body.isViewOncePreview, true);
  assert.equal(emittedEvents.length, 1);
  assert.equal(emittedEvents[0].event, "global-chat:new-message");
  assert.equal(emittedEvents[0].payload.imageUrl, null);
  assert.equal(emittedEvents[0].payload.fileName, null);

  const history = await controller.useCase.listMessages("author-id");
  assert.equal(history.messages[0].imageUrl, null);
  assert.equal(history.messages[0].fileName, null);
});

test("the author can delete their own view-once message and its image", async () => {
  setupMocks();
  const result = await new GlobalChatUseCase().deleteMessage(
    "message-1",
    "author-id",
  );

  assert.deepEqual(result, { messageId: "message-1", deleted: true });
  assert.equal(messages.has("message-1"), false);
  assert.deepEqual(deletedCloudinaryImages, ["private-image-public-id"]);
});

test("ordinary image messages still expose their image and filename", async () => {
  setupMocks([
    createMessage({
      id: "ordinary-message",
      viewOnce: false,
      content: "ordinary caption",
      image: "ordinary-image-public-id",
      fileName: "ordinary-image.jpg",
    }),
  ]);
  const history = await new GlobalChatUseCase().listMessages("reader-id");
  const [message] = history.messages;

  assert.equal(message.content, "ordinary caption");
  assert.ok(message.imageUrl);
  assert.equal(message.fileName, "ordinary-image.jpg");
  assert.equal(message.viewOnce, false);
  assert.equal(message.viewOnceStatus, null);
});

test("repository uses an atomic unique insert and reports duplicate reads", async () => {
  setupMocks();
  const repository = new GlobalChatRepository();

  const results = await Promise.all([
    repository.markViewed("message-1", "reader-id"),
    repository.markViewed("message-1", "reader-id"),
  ]);

  assert.deepEqual(results.map((result) => result.created).sort(), [false, true]);
  assert.equal(views.size, 1);
});
