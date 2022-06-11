const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../schemas/user.schema");
const Contract = require("../schemas/contract.schema");

const ObjectID = require("mongoose").Types.ObjectId;


//For now get all articles, In future maybe /artciles/get?size=50?page=3 where size is page size and page is page number (this would fetch 50 articles  )
router.get("/get/:id", async (req, res) => {
	try {
		const data = await Contract.find({_id: new ObjectID(req.params.id)}, {_id: 0, __v:0});
		console.log("GOT DATA", data)
		res.status(200).json(data);
	} catch (err) {
		console.log("Error fetching articles", err);
	}
});


router.post("/new", async (req, res) => {
	try {
        const {formFields, addr, user} = req.body;

        if (!formFields || !addr || !user)
            throw new Error("Missing parameter");
        
        console.log("Got this", formFields, addr, user);
        const newContract = new Contract({...formFields, addr: addr});
        let savedContract = await newContract.save();

		// Since users can only have 1 contract, assumes that if a new contract is being saved there is a new user
        const newUser = new User({addr: user, contract: savedContract.id});
        let data = await newUser.save();
		console.log(data);
		res.status(200).send(data);
	} catch (err) {
		console.log("Error fetching articles", err);
	}
});

module.exports = router