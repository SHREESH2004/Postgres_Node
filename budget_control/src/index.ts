import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { getClient } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Budget Control Service is running");
});

app.post("/transactions", async (req: Request, res: Response): Promise<void> => {
  const { fromId, toId, amount } = req.body;

  if (!fromId || !toId || amount <= 0) {
    res.status(400).json({ error: "Invalid transaction data" });
    return;
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const senderUpdate = await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE account_id = $2 AND balance >= $1 RETURNING account_id",
      [amount, fromId]
    );

    if (senderUpdate.rowCount === 0) {
      throw new Error("Insufficient funds or invalid sender ID");
    }

    const receiverUpdate = await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 RETURNING account_id",
      [amount, toId]
    );

    if (receiverUpdate.rowCount === 0) {
      throw new Error("Invalid receiver ID");
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Transaction completed successfully" });
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    res.status(500).json({ error: "Transaction failed", details: error.message });
  } finally {
    client.release();
  }
});


async function startServer() {
  try {
    const client = await getClient();
    console.log("Connected to Neon PostgreSQL successfully.");
    client.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to DB connection error:", error);
    process.exit(1); 
  }
}

startServer();