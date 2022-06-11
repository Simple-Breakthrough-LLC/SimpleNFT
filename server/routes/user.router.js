const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../schemas/user.schema");
const Contract = require("../schemas/contract.schema");


//For now get all articles, In future maybe /artciles/get?size=50?page=3 where size is page size and page is page number (this would fetch 50 articles  )
router.get("/get/:addr", async (req, res) => {
	try {
		const data = await User.find({addr: req.params.addr}).populate({path: "contract", model: Contract});
		res.status(200).send(data);
	} catch (err) {
		console.log("Error user", err);
	}
});

module.exports = router