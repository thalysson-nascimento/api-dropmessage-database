import express, { Router } from "express";
import {
  uploadWithCloudinary,
  uploadWithCloudinaryPosts,
} from "./lib/multerCloudinary";
import { ensureAuthenticateUserAdmin } from "./middlewares/ensureAuthenticateUserAdmin";
import { CreateUserController } from "./modules/account/create-account/useCase/createUserController";
import { AuthUserController } from "./modules/account/credentials-account/useCase/authUserUseController";
import { ActiveSubscriptionController } from "./modules/active-subscription/useCase/activeSubscription/activeSubscriptionController";
import { UpdateAdMobVideoRewardController } from "./modules/admob-video-reward/update-admob-video-reward/useCase/updateAdMobVideoRewardController";
import { CreateAvatarCloudinaryController } from "./modules/avatarCloudinary/createAvatar/useCase/createAvatarCloudinaryController";
import { CancelSubscriptionStripeController } from "./modules/cancel-subscription-stripe/useCase/cancelSubscriptionStripe/cancelSubscriptionStripeController";
import { GetCodeConfirmationEmailController } from "./modules/confirmationCodeEmail/getConfirmation/useCase/getCodeConfirmationEmailController";
import { DeleteAccountController } from "./modules/delete-account/useCase/deleteAccountController";
import { CreateGenerateTipsWithGpt4oMiniController } from "./modules/generate-tips-with-gpt4o-mini/create-generate-tips-with-gpt4o-mini/useCase/createGenerateTipsWithGpt4oMiniController";
import { LastLikePostMessageController } from "./modules/last-like-post-message/useCase/lastLikePostMessage/lastLikePostMessageController";
import { CreateLikePostMessageController } from "./modules/like-post-message/create-like-post-message/useCase/createLikePostMessageController";
import { GetListChatController } from "./modules/list-chat/get-list-chat/useCase/getListChatController";
import { LoggerTrackActionController } from "./modules/logger/track-action/info/useCase/loggerTrackAction/loggerTrackActionController";
import { GetMyProfileController } from "./modules/my-profile/get-my-profile/useCase/getMyProfileController";
import { GetNotificationController } from "./modules/notification/get-notification/useCase/getNotificationController";
import { CreatePostMessageCloudinaryController } from "./modules/post-message-cloudinary/create-post-message-cloudinary/useCase/createPostMessageCloudinaryController";
import { GetPostMessageCloudinaryController } from "./modules/post-message-cloudinary/get-post-message-cloudinary/useCase/getPostMessageCloudinaryController";
import { ReportProblemController } from "./modules/report-problem/useCase/reportProblem/reportProblemController";
import { CreateSendMessageController } from "./modules/send-message/create-send-message/useCase/createSendMessageController";
import { GetSendMessageController } from "./modules/send-message/get-send-message/useCase/getSendMessageController";
import { CreateSessionStripePaymentController } from "./modules/sessionStripePayment/useCase/createSessionStripePayment/createSessionStripePaymentController";
import { GetSessionStripePaymentController } from "./modules/sessionStripePayment/useCase/getSessionStripePayment/getSessionStripePaymentController";
import { StaticLikePreferencesController } from "./modules/static-like-preferences/get-static-like-preferences/useCase/staticLikePreferencesController";
import { CreateStripeWebhookController } from "./modules/stripe-webhook/useCase/createStripeWebhook/createStripeWebhookController";
import { CreateUnLikePostMessageController } from "./modules/unlike-post-message/create-unlike-post-message/useCase/createUnLikePostMessageController";
import { UnMatchController } from "./modules/unmatch/useCase/UnMatch/UnMatchController";
import { CreateUserDescriptionCompleteController } from "./modules/user-description-complete/create-user-description-complete/useCase/createUserDescriptionCompleteController";
import { CreateUserDescriptionController } from "./modules/user-description/create-user-description/useCase/createUserDescriptionController";
import { CreateUserLocationController } from "./modules/user-location/create-user-location/useCase/createUserLocationController";
import { GetUserPostMessageController } from "./modules/user-post-message/get-user-post-message/useCase/getUserPostMessageController";
import { GetUserController } from "./modules/user/get-user/useCase/getUserController";

const routes = Router();
const createUserController = new CreateUserController();
const getCredentiaAccount = new AuthUserController();
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
const createPostMessageCloudinaryController =
  new CreatePostMessageCloudinaryController();
const getPostMessageCloudinaryController =
  new GetPostMessageCloudinaryController();
const updateAdMobVideoRewardController = new UpdateAdMobVideoRewardController();
const createUnLikePostMessageController =
  new CreateUnLikePostMessageController();
const getCodeConfirmationEmailController =
  new GetCodeConfirmationEmailController();
const createGenerateTipsWithGpt4oMiniController =
  new CreateGenerateTipsWithGpt4oMiniController();
const createUserDescriptionController = new CreateUserDescriptionController();
const createUserDescriptionCompleteController =
  new CreateUserDescriptionCompleteController();
const loggerTrackActionController = new LoggerTrackActionController();
const unMatchController = new UnMatchController();
const createSessionStripePaymentController =
  new CreateSessionStripePaymentController();
const getSessionStripePaymentController =
  new GetSessionStripePaymentController();
const createStripeWebhookController = new CreateStripeWebhookController();
const cancelSubscriptionStripeController =
  new CancelSubscriptionStripeController();
const reportProblemController = new ReportProblemController();
const activeSubscriptionController = new ActiveSubscriptionController();
const lastLikePostMessageController = new LastLikePostMessageController();

routes.get("/test", (req, res) => {
  res.json({ message: "Hello world" });
});

routes.post("/auth/create-account", createUserController.handle);
routes.post("/auth/user-credentials", getCredentiaAccount.handle);

routes.get(
  "/post-message",
  ensureAuthenticateUserAdmin,
  getPostMessageCloudinaryController.handle.bind(
    getPostMessageCloudinaryController
  )
);

routes.post(
  "/post-message",
  ensureAuthenticateUserAdmin,
  uploadWithCloudinaryPosts.single("file"),
  (request, response) => {
    createPostMessageCloudinaryController.handle(request, response);
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

// routes.get("/avatar", ensureAuthenticateUserAdmin, getAvatarController.handle);

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

routes.get(
  "/update-admob-video-reward",
  ensureAuthenticateUserAdmin,
  updateAdMobVideoRewardController.handle.bind(updateAdMobVideoRewardController)
);

routes.post(
  "/unlike-post-message",
  ensureAuthenticateUserAdmin,
  createUnLikePostMessageController.handle.bind(
    createUnLikePostMessageController
  )
);

getCodeConfirmationEmailController;

routes.get(
  "/code-confirmation-email",
  ensureAuthenticateUserAdmin,
  getCodeConfirmationEmailController.handle.bind(
    getCodeConfirmationEmailController
  )
);

routes.get(
  "/generate-tips",
  ensureAuthenticateUserAdmin,
  createGenerateTipsWithGpt4oMiniController.handle.bind(
    createGenerateTipsWithGpt4oMiniController
  )
);

routes.post(
  "/user-description",
  ensureAuthenticateUserAdmin,
  createUserDescriptionController.handle.bind(createUserDescriptionController)
);

routes.post(
  "/user-description-complete",
  ensureAuthenticateUserAdmin,
  createUserDescriptionCompleteController.handle.bind(
    createUserDescriptionCompleteController
  )
);

routes.post(
  "/logger/track-action/info",
  ensureAuthenticateUserAdmin,
  loggerTrackActionController.handle.bind(loggerTrackActionController)
);

routes.post(
  "/report-problem",
  ensureAuthenticateUserAdmin,
  reportProblemController.handle.bind(reportProblemController)
);

routes.post(
  "/unmatch",
  ensureAuthenticateUserAdmin,
  unMatchController.handle.bind(unMatchController)
);

routes.post(
  "/session/payment-intent",
  ensureAuthenticateUserAdmin,
  createSessionStripePaymentController.handle.bind(
    createSessionStripePaymentController
  )
);

routes.get(
  "/stripe/list-subscription",
  ensureAuthenticateUserAdmin,
  getSessionStripePaymentController.handle.bind(
    getSessionStripePaymentController
  )
);

routes.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  createStripeWebhookController.handle.bind(createStripeWebhookController)
);

routes.post(
  "/stripe/cancel-subscripton",
  ensureAuthenticateUserAdmin,
  cancelSubscriptionStripeController.handle.bind(
    cancelSubscriptionStripeController
  )
);

routes.get(
  "/active-subscription",
  ensureAuthenticateUserAdmin,
  activeSubscriptionController.handle.bind(activeSubscriptionController)
);

routes.get(
  "/last-like-post-message",
  ensureAuthenticateUserAdmin,
  lastLikePostMessageController.handle.bind(lastLikePostMessageController)
);

// routes.post("/api/create-payment-intent", async (req, res) => {
//   try {
//     const paymentIntent = await clientStripe.paymentIntents.create({
//       amount: 5000, // Valor em centavos (ex.: $50.00 = 5000)
//       currency: "usd",
//       payment_method_types: ["card"],
//     });

//     res.json({ clientSecret: paymentIntent.client_secret });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// });

export { routes };
