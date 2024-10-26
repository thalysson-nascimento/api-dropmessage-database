import { Router } from "express";
import multer from "multer";
import uploadConfig from "./config/upload";
import { CreateUserController } from "./modules/account/create-account/useCase/createUserController";
import { AuthUserController } from "./modules/account/credentials-account/useCase/authUserUseController";
import { CreatePostMessageController } from "./modules/post-message/create-post-message/useCase/createPostMessageController";
import { GetPostMessageController } from "./modules/post-message/get-post-message/useCase/getPostMessageController";
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

const routes = Router();
const createUserController = new CreateUserController();
const getCredentiaAccount = new AuthUserController();
const getPostMessageController = new GetPostMessageController();
const createPostMessageController = new CreatePostMessageController();

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
  res.json({ message: true });
});

routes.post("/auth/create-account", createUserController.handle);
routes.post("/auth/user-credentials", getCredentiaAccount.handle);
routes.get("/post-message", getPostMessageController.handle);

routes.post("/post-message", uploadPost.single("file"), (request, response) => {
  createPostMessageController.handle(request, response);
});

// routes.post(
//   "/security-request/token-response",
//   createTokenResponseController.handle
// );

// routes.put("/webhook", updateWebhookController.handle);

// routes.get("/webhook", getWebHookController.handle);

// routes.get("/pix", getPixController.handle);

// routes.put("/pix", updatePixController.handle);

// routes.post("/user-admin", createUserAdminController.handle);

// routes.post(
//   "/data-company",
//   ensureAuthenticateUserAdmin,
//   createDataCompanyController.handle
// );

// routes.get(
//   "/data-company",
//   ensureAuthenticateUserAdmin,
//   getDataCompanyController.handle
// );

// routes.post(
//   "/user-credentials",
//   ensureAuthenticateUserAdmin,
//   createUserCredentialsController.handle
// );

// routes.get(
//   "/user-credential",
//   ensureAuthenticateUserAdmin,
//   getUserCredentialsController.handle
// );

export { routes };
