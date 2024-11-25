import { Router } from "express";
import multer from "multer";
import uploadConfig from "./config/upload";
import uploadConfigAvatar from "./config/upload-avatar";
import uploadWithCloudinary from "./lib/multerCloudinary";
import { ensureAuthenticateUserAdmin } from "./middlewares/ensureAuthenticateUserAdmin";
import { CreateUserController } from "./modules/account/create-account/useCase/createUserController";
import { AuthUserController } from "./modules/account/credentials-account/useCase/authUserUseController";
import { GetAvatarController } from "./modules/avatar/get-avatar/useCase/getAvatarController";
import { CreateAvatarCloudinaryController } from "./modules/avatarCloudinary/createAvatar/useCase/createAvatarCloudinaryController";
import { DeleteAccountController } from "./modules/delete-account/useCase/deleteAccountController";
import { CreateLikePostMessageController } from "./modules/like-post-message/create-like-post-message/useCase/createLikePostMessageController";
import { GetListChatController } from "./modules/list-chat/get-list-chat/useCase/getListChatController";
import { GetMyProfileController } from "./modules/my-profile/get-my-profile/useCase/getMyProfileController";
import { GetNotificationController } from "./modules/notification/get-notification/useCase/getNotificationController";
import { CreatePostMessageController } from "./modules/post-message/create-post-message/useCase/createPostMessageController";
import { GetPostMessageController } from "./modules/post-message/get-post-message/useCase/getPostMessageController";
import { CreateSendMessageController } from "./modules/send-message/create-send-message/useCase/createSendMessageController";
import { GetSendMessageController } from "./modules/send-message/get-send-message/useCase/getSendMessageController";
import { StaticLikePreferencesController } from "./modules/static-like-preferences/get-static-like-preferences/useCase/staticLikePreferencesController";
import { CreateUserLocationController } from "./modules/user-location/create-user-location/useCase/createUserLocationController";
import { GetUserPostMessageController } from "./modules/user-post-message/get-user-post-message/useCase/getUserPostMessageController";
import { GetUserController } from "./modules/user/get-user/useCase/getUserController";

const uploadPost = multer(uploadConfig.upload("./image/post"));
const uploadAvatar = multer(
  uploadConfigAvatar.uploadAvatar("./image/user-avatar")
);

const routes = Router();
const createUserController = new CreateUserController();
const getCredentiaAccount = new AuthUserController();
const getPostMessageController = new GetPostMessageController();
const createPostMessageController = new CreatePostMessageController();
const getAvatarController = new GetAvatarController();
const createLikePostMessageController = new CreateLikePostMessageController();
const getUserController = new GetUserController();
const createUserLocationController = new CreateUserLocationController();
const getNotificatinController = new GetNotificationController();
const staticLikePreferencesController = new StaticLikePreferencesController();
const getUserPostMessageController = new GetUserPostMessageController();
const getMyProfileController = new GetMyProfileController();
const getListChatController = new GetListChatController();
const createSendMessageController = new CreateSendMessageController();
const getSendMessageController = new GetSendMessageController();
const deleteAccountController = new DeleteAccountController();
const createAvatarCloudinaryController = new CreateAvatarCloudinaryController();

routes.get("/test", (req, res) => {
  res.json({ message: "Hello world" });
});

routes.post("/auth/create-account", createUserController.handle);
routes.post("/auth/user-credentials", getCredentiaAccount.handle);

routes.get(
  "/post-message",
  ensureAuthenticateUserAdmin,
  getPostMessageController.handle
);

routes.post(
  "/post-message",
  ensureAuthenticateUserAdmin,
  uploadPost.single("file"),
  (request, response) => {
    createPostMessageController.handle(request, response);
  }
);

routes.post(
  "/avatar-and-about",
  ensureAuthenticateUserAdmin,
  uploadWithCloudinary.single("file"),
  (request, response) => {
    createAvatarCloudinaryController.handle(request, response);
  }
);

routes.get("/avatar", ensureAuthenticateUserAdmin, getAvatarController.handle);

routes.post(
  "/like-post-message",
  ensureAuthenticateUserAdmin,
  createLikePostMessageController.handle
);

routes.get("/user", ensureAuthenticateUserAdmin, getUserController.handle);

routes.post(
  "/user-location",
  ensureAuthenticateUserAdmin,
  createUserLocationController.handle
);

routes.get(
  "/notification",
  ensureAuthenticateUserAdmin,
  getNotificatinController.handle
);

routes.get(
  "/static-like-preferences",
  ensureAuthenticateUserAdmin,
  staticLikePreferencesController.handle.bind(staticLikePreferencesController)
);

routes.get(
  "/list-chat",
  ensureAuthenticateUserAdmin,
  getListChatController.handle.bind(getListChatController)
);

routes.get(
  "/user-post-message",
  ensureAuthenticateUserAdmin,
  getUserPostMessageController.handle.bind(getUserPostMessageController)
);

routes.post(
  "/send-message",
  ensureAuthenticateUserAdmin,
  createSendMessageController.handle.bind(createSendMessageController)
);

routes.get(
  "/send-message",
  ensureAuthenticateUserAdmin,
  getSendMessageController.handle.bind(getSendMessageController)
);

routes.post(
  "/delete-account",
  ensureAuthenticateUserAdmin,
  deleteAccountController.handle.bind(deleteAccountController)
);

routes.get(
  "/my-profile",
  ensureAuthenticateUserAdmin,
  getMyProfileController.handle
);

export { routes };
