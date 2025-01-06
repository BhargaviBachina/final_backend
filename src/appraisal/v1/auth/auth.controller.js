const authService = require('./auth.service');
const { sendResponse } = require('../../utils/responseHelper');
const registerSchema = require('./auth.validation');

exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return sendResponse(res, 400, error.details[0].message);
    }
    const result = await authService.register(value);
    sendResponse(res, 201, "User registered successfully", result);
  } catch (error) {
    sendResponse(res, 500, error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    //res.status(200).json(result);
    sendResponse(res, 200, "User logged in successfully", result);
  } catch (error) {
    //res.status(401).json({ message: error.message });
    sendResponse(res, 401, error.message);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    //res.status(200).json(result);
    sendResponse(res, 200, "Password reset email sent successfully", result);
  } catch (error) {
    //res.status(500).json({ message: error.message });
    sendResponse(res, 500, error.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
  
    sendResponse(res, 200, "Password reset successful. Redirecting to login page", result);
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await authService.getProfile(req.userId);
    sendResponse(res, 200, "User profile retrieved successfully", result);
  } catch (error) {
    sendResponse(res, 500, error.message);
  }
};
