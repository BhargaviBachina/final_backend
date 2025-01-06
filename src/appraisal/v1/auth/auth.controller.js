const authService = require('./auth.service');
const { sendResponse } = require('../../utils/responseHelper');

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    sendResponse(res, 201, "User registered successfully", result);
    // res.status(201).json(result);
  } catch (error) {
    //res.status(500).json({ message: error.message });
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
    //res.status(200).json(result);
    sendResponse(res, 200, "Password reset successful", result);
  } catch (error) {
    //res.status(400).json({ message: error.message });
    sendResponse(res, 400, error.message);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await authService.getProfile(req.userId);
    //res.status(200).json(result);
    sendResponse(res, 200, "User profile retrieved successfully", result);
  } catch (error) {
    //res.status(500).json({ message: error.message });
    sendResponse(res, 500, error.message);
  }
};
