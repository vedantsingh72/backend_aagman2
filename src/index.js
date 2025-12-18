import dotenv from "dotenv";
import app from "./app.js";
import DBconnect from "./db/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

DBconnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      
    });
  })
  .catch((error) => {
    console.error("Server failed to start", error);
  });
