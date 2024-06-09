import express , {Request,Response} from "express"
import {check , validationResult } from 'express-validator';
const User: express.Router = express.Router()

User.post("/",
[
    check('address').notEmpty().withMessage('Address cannot be empty')
]
,(req: Request, res: Response)=>{
    const error = validationResult(req)
    if(!error.isEmpty())
    {
      return  res.status(400).json({error:(error.array())[0].msg})
    }
   const address = req.body
   // check the value to DB and send msg accordingly
    res.status(201).send("done")

})
export default User;
