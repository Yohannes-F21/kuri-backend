const { StatusCodes } = require("http-status-codes");
const { LogModel } = require("../../models/Log.model");

module.exports = {
    getLogs: async (req, res) => {
        try {
            const logs = await LogModel.find();
            res.status(StatusCodes.OK).json({ logs });
        } catch (error) {
            res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: error.message });
        }
    },
}