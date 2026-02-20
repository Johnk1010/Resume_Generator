import type { RequestHandler } from "express";
import { HttpError } from "../lib/errors.js";
import { forgotPassword, login, refresh, register, resetPassword } from "../services/auth.service.js";
import { toMessageResponse } from "../views/auth.view.js";

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const data = await register(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const data = await login(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken;

    if (typeof refreshToken !== "string" || refreshToken.length < 20) {
      throw new HttpError(400, "refreshToken e obrigatorio");
    }

    const tokens = await refresh(refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController: RequestHandler = async (req, res, next) => {
  try {
    await forgotPassword(req.body);
    res.json(toMessageResponse("Se o e-mail existir, um link de reset foi gerado."));
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController: RequestHandler = async (req, res, next) => {
  try {
    await resetPassword(req.body);
    res.json(toMessageResponse("Senha atualizada com sucesso."));
  } catch (error) {
    next(error);
  }
};