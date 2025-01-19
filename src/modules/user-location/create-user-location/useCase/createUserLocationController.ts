import { Request, Response } from "express";
import Joi from "joi";
import { CreateUserLocationUseCase } from "./createUserLocationUseCase";

const schema = Joi.object({
  state: Joi.string().required(),
  stateCode: Joi.string().required(),
  city: Joi.string().required(),
  continent: Joi.string().required(),
  country: Joi.string().required(),
  countryCode: Joi.string().required(),
  currency: Joi.string().required(),
});

export class CreateUserLocationController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const {
      state,
      stateCode,
      city,
      continent,
      country,
      countryCode,
      currency,
    } = request.body;

    const { error } = schema.validate(request.body);
    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const createUserLocationUseCase = new CreateUserLocationUseCase();
      const result = await createUserLocationUseCase.execute({
        state,
        stateCode,
        city,
        userId,
        continent,
        country,
        countryCode,
        currency,
      });
      return response.status(201).json(result);
    } catch (error) {
      return response.status(400).json({
        message: error,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }
  }
}
