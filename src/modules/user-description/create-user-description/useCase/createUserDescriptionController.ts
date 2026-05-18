import { Request, Response } from "express";
import Joi from "joi";
import { GetLocationByIpService } from "../../../../service/GetLocationByIpService";
import { CreateUserLocationUseCase } from "../../../user-location/create-user-location/useCase/createUserLocationUseCase";
import { CreateUserDescriptionUseCase } from "./createUserDescriptionUseCase";

const schema = Joi.object().keys({
  userDescription: Joi.string().max(200).required(),
});

export class CreateUserDescriptionController {
  useCase: CreateUserDescriptionUseCase;

  constructor() {
    this.useCase = new CreateUserDescriptionUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BAD_REQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const { userDescription } = value as { userDescription: string };

      const result = await this.useCase.execute(userId, userDescription);

      const forwarded = request.headers["x-forwarded-for"];

      const ip = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded?.split(",")[0] || request.socket.remoteAddress || "";

      const getLocationByIpService = new GetLocationByIpService();

      const location = await getLocationByIpService.execute(ip);

      const createUserLocationUseCase = new CreateUserLocationUseCase();

      try {
        await createUserLocationUseCase.execute({
          ...location,
          userId,
        });
      } catch {
        // ignore
        console.error("Error creating user location");
      }

      return response.json(result);
    } catch (error: any) {
      return response.status(error.status || 500).json({
        message: error.message,
        code: error.status ? "ERR_BAD_REQUEST" : "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.status || 500,
      });
    }
  }
}
