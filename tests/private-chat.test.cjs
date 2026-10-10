const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Module } = require("node:module");
const { test } = require("node:test");
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

const redisFilename = require.resolve("../src/lib/redis.ts");
const redisModule = new Module(redisFilename, module);
redisModule.filename = redisFilename;
redisModule.loaded = true;
redisModule.exports = {
  client: { del: async () => undefined },
  subscriberClient: {},
};
require.cache[redisFilename] = redisModule;

const cloudinary = require("../src/service/cloudinary.service");
const { prismaCliente } = require("../src/database/prismaCliente");
const { joinPrivateChatRoom } = require("../src/lib/socket");
const {
  serializePrivateMessage,
} = require("../src/modules/send-message/create-send-message/useCase/createSendMessageRepository");
const {
  CreateSendMessageUseCase,
} = require("../src/modules/send-message/create-send-message/useCase/createSendMessageUseCase");
const {
  GetSendMessageUseCase,
} = require("../src/modules/send-message/get-send-message/useCase/getSendMessageUseCase");

const originalCloudinary = {
  upload: cloudinary.uploadAuthenticatedImage,
  delete: cloudinary.deleteAuthenticatedImage,
  getImageUrl: cloudinary.getImageUrl,
  temporaryUrl: cloudinary.getTemporaryAuthenticatedImageUrl,
};

function matchFixture() {
  return {
    id: "match-1",
    initiatorId: "sender-id",
    recipientId: "recipient-id",
    unMatch: false,
    initiator: { userHashPublic: "sender-public" },
    recipient: { userHashPublic: "recipient-public" },
  };
}

function setupCloudinary() {
  cloudinary.uploadAuthenticatedImage = async () => ({
    public_id: "private-chat/image-id",
  });
  cloudinary.deleteAuthenticatedImage = async () => ({ result: "ok" });
  cloudinary.getImageUrl = (id) => `https://cdn.test/${id}`;
  cloudinary.getTemporaryAuthenticatedImageUrl = (id, format, expiresAt) =>
    `https://temporary.test/${id}.${format}?expires_at=${expiresAt}`;
}

function restoreCloudinary() {
  Object.assign(cloudinary, {
    uploadAuthenticatedImage: originalCloudinary.upload,
    deleteAuthenticatedImage: originalCloudinary.delete,
    getImageUrl: originalCloudinary.getImageUrl,
    getTemporaryAuthenticatedImageUrl: originalCloudinary.temporaryUrl,
  });
}

test("private message creation enforces JWT user, public hash, and match membership", async () => {
  setupCloudinary();
  const useCase = new CreateSendMessageUseCase();
  const calls = [];
  useCase.repository = {
    getMatchById: async () => matchFixture(),
    createSendMessage: async (...args) => {
      calls.push(args);
      return { id: "new-message", viewOnce: false };
    },
  };

  try {
    const result = await useCase.execute(
      "sender-id",
      "match-1",
      "sender-public",
      "hello",
    );
    assert.equal(result.id, "new-message");
    assert.deepEqual(calls[0].slice(0, 4), [
      "match-1",
      "sender-id",
      "hello",
      undefined,
    ]);

    await assert.rejects(
      useCase.execute("sender-id", "match-1", "recipient-public", "hello"),
      (error) => error.statusCode === 403,
    );
    await assert.rejects(
      useCase.execute("outsider-id", "match-1", "outsider-public", "hello"),
      (error) => error.statusCode === 403,
    );
  } finally {
    restoreCloudinary();
  }
});

test("private socket rooms require active match membership", async () => {
  const originalFindFirst = prismaCliente.match.findFirst;
  const joinedRooms = [];
  const socket = {
    data: {},
    join: async (room) => joinedRooms.push(room),
  };

  try {
    prismaCliente.match.findFirst = async ({ where }) =>
      where.OR.some(
        (participant) => participant.initiatorId === "sender-id",
      )
        ? { id: where.id }
        : null;

    assert.equal(
      await joinPrivateChatRoom(socket, "match-1", "sender-id"),
      true,
    );
    assert.deepEqual(joinedRooms, ["match-1"]);
    assert.equal(socket.data.matchId, "match-1");

    assert.equal(
      await joinPrivateChatRoom(socket, "other-match", "outsider-id"),
      false,
    );
    assert.deepEqual(joinedRooms, ["match-1"]);
  } finally {
    prismaCliente.match.findFirst = originalFindFirst;
  }
});

test("private photo creation hides view-once media and rejects invalid combinations", async () => {
  setupCloudinary();
  const useCase = new CreateSendMessageUseCase();
  let createdArgs;
  useCase.repository = {
    getMatchById: async () => matchFixture(),
    createSendMessage: async (...args) => {
      createdArgs = args;
      return { id: "view-once-message", viewOnce: args[6] };
    },
  };
  const imageFile = {
    originalname: "photo.jpg",
    mimetype: "image/jpeg",
    size: 256,
  };

  try {
    const result = await useCase.execute(
      "sender-id",
      "match-1",
      "sender-public",
      undefined,
      imageFile,
      "true",
    );
    assert.equal(result.viewOnce, true);
    assert.equal(createdArgs[3], "private-chat/image-id");
    assert.equal(createdArgs[6], true);

    await assert.rejects(
      useCase.execute(
        "sender-id",
        "match-1",
        "sender-public",
        undefined,
        undefined,
        "true",
      ),
      (error) => error.statusCode === 400,
    );
    await assert.rejects(
      useCase.execute(
        "sender-id",
        "match-1",
        "sender-public",
        undefined,
        { ...imageFile, mimetype: "application/pdf" },
      ),
      (error) => error.statusCode === 400,
    );
  } finally {
    restoreCloudinary();
  }
});

test("a private view-once image can be opened once by the other participant only", async () => {
  setupCloudinary();
  const useCase = new CreateSendMessageUseCase();
  const seen = new Set();
  useCase.repository = {
    getMessageForView: async () => ({
      id: "photo-message",
      matchId: "match-1",
      content: null,
      image: "private-chat/photo-id",
      fileName: "photo.jpg",
      format: "jpg",
      viewOnce: true,
      userId: "sender-id",
      createdAt: new Date("2026-10-09T12:00:00.000Z"),
      user: {
        userHashPublic: "sender-public",
        name: "Sender",
      },
      match: {
        id: "match-1",
        initiatorId: "sender-id",
        recipientId: "recipient-id",
        unMatch: false,
      },
    }),
    registerView: async (messageId, userId) => {
      const key = `${messageId}:${userId}`;
      if (seen.has(key)) return { count: 0 };
      seen.add(key);
      return { count: 1 };
    },
  };

  try {
    const result = await useCase.viewOnceMessage(
      "photo-message",
      "match-1",
      "recipient-id",
    );
    assert.equal(result.message.viewOnce, true);
    assert.equal(result.message.viewOnceStatus, "READ");
    assert.match(result.message.imageUrl, /^https:\/\/temporary\.test\//);
    assert.equal(result.message.fileName, "photo.jpg");

    await assert.rejects(
      useCase.viewOnceMessage("photo-message", "match-1", "recipient-id"),
      (error) => error.statusCode === 409,
    );
    await assert.rejects(
      useCase.viewOnceMessage("photo-message", "match-1", "sender-id"),
      (error) => error.statusCode === 403,
    );
    await assert.rejects(
      useCase.viewOnceMessage("photo-message", "match-2", "recipient-id"),
      (error) => error.statusCode === 404,
    );
    assert.equal(seen.size, 1);
  } finally {
    restoreCloudinary();
  }
});

test("concurrent private view-once opens are consumed atomically", async () => {
  setupCloudinary();
  const useCase = new CreateSendMessageUseCase();
  const seen = new Set();
  useCase.repository = {
    getMessageForView: async () => ({
      id: "photo-message",
      matchId: "match-1",
      content: null,
      image: "private-chat/photo-id",
      fileName: "photo.jpg",
      format: "jpg",
      viewOnce: true,
      userId: "sender-id",
      createdAt: new Date(),
      user: { userHashPublic: "sender-public", name: "Sender" },
      match: {
        id: "match-1",
        initiatorId: "sender-id",
        recipientId: "recipient-id",
        unMatch: false,
      },
    }),
    registerView: async (messageId, userId) => {
      const key = `${messageId}:${userId}`;
      if (seen.has(key)) return { count: 0 };
      seen.add(key);
      return { count: 1 };
    },
  };

  try {
    const results = await Promise.allSettled([
      useCase.viewOnceMessage("photo-message", "match-1", "recipient-id"),
      useCase.viewOnceMessage("photo-message", "match-1", "recipient-id"),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = results.find((result) => result.status === "rejected");
    assert.equal(rejected.reason.statusCode, 409);
    assert.equal(seen.size, 1);
  } finally {
    restoreCloudinary();
  }
});

test("private view-once media is hidden from create and socket serialization", () => {
  const message = {
    id: "view-once-message",
    matchId: "match-1",
    createdAt: new Date(),
    content: null,
    image: "private-chat/secret",
    fileName: "secret.jpg",
    viewOnce: true,
    user: {
      userHashPublic: "sender-public",
      name: "Sender",
      avatar: null,
    },
  };
  const serialized = serializePrivateMessage(message);

  assert.equal(serialized.imageUrl, null);
  assert.equal(serialized.fileName, null);
  assert.equal(serialized.viewOnceStatus, "PENDING");
  assert.equal(serialized.matchId, "match-1");
  assert.equal(serialized.user.userHashPublic, "sender-public");
});

test("private history keeps paginated shape and hides view-once URLs", async () => {
  setupCloudinary();
  const useCase = new GetSendMessageUseCase();
  useCase.repository = {
    getMatchWithUsers: async () => ({
      id: "match-1",
      initiatorId: "sender-id",
      recipientId: "recipient-id",
      initiator: {
        id: "sender-id",
        userHashPublic: "sender-public",
        name: "Sender",
        avatar: null,
      },
      recipient: {
        id: "recipient-id",
        userHashPublic: "recipient-public",
        name: "Recipient",
        avatar: null,
      },
    }),
    getMessages: async () => [
      {
        id: "text-1",
        content: "hello",
        image: null,
        fileName: null,
        viewOnce: false,
        views: [],
        createdAt: new Date(),
        user: {
          id: "sender-id",
          userHashPublic: "sender-public",
          name: "Sender",
          avatar: null,
        },
      },
      {
        id: "photo-1",
        content: null,
        image: "private-chat/secret",
        fileName: "secret.jpg",
        viewOnce: true,
        views: [],
        createdAt: new Date(),
        user: {
          id: "recipient-id",
          userHashPublic: "recipient-public",
          name: "Recipient",
          avatar: null,
        },
      },
    ],
    countMessages: async () => 2,
    getOnlineStatus: async () => ({ isOnline: true }),
  };

  try {
    const result = await useCase.execute("match-1", "sender-id", 1, 15);
    assert.equal(result.messages.length, 2);
    assert.equal(result.messages[0].content, "hello");
    assert.equal(result.messages[0].viewOnce, false);
    assert.equal(result.messages[1].imageUrl, null);
    assert.equal(result.messages[1].fileName, null);
    assert.equal(result.messages[1].viewOnceStatus, "PENDING");
    assert.equal(result.pagination.limit, 15);
    assert.equal(result.match.id, "match-1");
  } finally {
    restoreCloudinary();
  }
});
