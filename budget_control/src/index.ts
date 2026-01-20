import e from "express";
import dotenv from "dotenv";

dotenv.config();

const app = e();
const PORT=process.env.PORT ;
app.get("/", (req, res) => {
  res.send("Budget Control Service is running");
})
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});