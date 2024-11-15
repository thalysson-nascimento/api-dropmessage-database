import { Router } from "express";
import multer from "multer";
import uploadConfig from "./config/upload";
import uploadConfigAvatar from "./config/upload-avatar";
import { ensureAuthenticateUserAdmin } from "./middlewares/ensureAuthenticateUserAdmin";
import { CreateUserController } from "./modules/account/create-account/useCase/createUserController";
import { AuthUserController } from "./modules/account/credentials-account/useCase/authUserUseController";
import { CreateAvatarController } from "./modules/avatar/create-avatar/useCase/createAvatarController";
import { GetAvatarController } from "./modules/avatar/get-avatar/useCase/getAvatarController";
import { CreateLikePostMessageController } from "./modules/like-post-message/create-like-post-message/useCase/createLikePostMessageController";
import { GetNotificationController } from "./modules/notification/get-notification/useCase/getNotificationController";
import { CreatePostMessageController } from "./modules/post-message/create-post-message/useCase/createPostMessageController";
import { GetPostMessageController } from "./modules/post-message/get-post-message/useCase/getPostMessageController";
import { StaticLikePreferencesController } from "./modules/static-like-preferences/get-static-like-preferences/useCase/staticLikePreferencesController";
import { CreateUserLocationController } from "./modules/user-location/create-user-location/useCase/createUserLocationController";
import { GetUserPostMessageController } from "./modules/user-post-message/get-user-post-message/useCase/getUserPostMessageController";
import { GetUserController } from "./modules/user/get-user/useCase/getUserController";
// import { AuthUserAdminController } from "./modules/account/authUser/useCase/getAuthUser/authUserUseController";
// import { CreateDataCompanyController } from "./modules/dataCompany/useCases/createDataCompany/createDataCompanyController";
// import { GetDataCompanyController } from "./modules/dataCompany/useCases/getDataCompany/getDataCompanyController";
// import { GetPixController } from "./modules/pix/useCases/getPix/getPixControler";
// import { UpdatePixController } from "./modules/pix/useCases/updatePix/useCase/updatePixController";
// import { CreateTokenResponseController } from "./modules/tokenResponse/useCases/createTokenResponse/createTokenResponseController";
// import { CreateUserAdminController } from "./modules/userAdmin/useCase/createUserAdmin/createUserAdminController";
// import { CreateUserCredentialsController } from "./modules/userCredentials/useCases/createUserCredentials/createUserCredentialsController";
// import { GetUserCredentialsController } from "./modules/userCredentials/useCases/getUserCredentials/getUserCredentialsController";
// import { GetWebhookController } from "./modules/webhook/useCases/getWebhook/getWebhookController";
// import { UpdateWebhookController } from "./modules/webhook/useCases/updateWebhook/updateWebhookController";

const uploadPost = multer(uploadConfig.upload("./image/post"));
const uploadAvatar = multer(
  uploadConfigAvatar.uploadAvatar("./image/user-avatar")
);

const routes = Router();
const createUserController = new CreateUserController();
const getCredentiaAccount = new AuthUserController();
const getPostMessageController = new GetPostMessageController();
const createPostMessageController = new CreatePostMessageController();
const createAvatarController = new CreateAvatarController();
const getAvatarController = new GetAvatarController();
const createLikePostMessageController = new CreateLikePostMessageController();
const getUserController = new GetUserController();
const createUserLocationController = new CreateUserLocationController();
const getNotificatinController = new GetNotificationController();
const staticLikePreferencesController = new StaticLikePreferencesController();
const getUserPostMessageController = new GetUserPostMessageController();

// const createTokenResponseController = new CreateTokenResponseController();
// const updateWebhookController = new UpdateWebhookController();
// const getWebHookController = new GetWebhookController();
// const getPixController = new GetPixController();
// const updatePixController = new UpdatePixController();
// const createUserAdminController = new CreateUserAdminController();
// const authUserAdminController = new AuthUserAdminController();
// const createDataCompanyController = new CreateDataCompanyController();
// const getDataCompanyController = new GetDataCompanyController();
// const createUserCredentialsController = new CreateUserCredentialsController();
// const getUserCredentialsController = new GetUserCredentialsController();

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
  uploadAvatar.single("file"),
  (request, response) => {
    createAvatarController.handle(request, response);
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
  "/user-post-message",
  ensureAuthenticateUserAdmin,
  getUserPostMessageController.handle.bind(getUserPostMessageController)
);

export { routes };
