import Dexie from "dexie";

export const db = new Dexie("farmEvidenceDb");
db.version(1).stores({
  sessions: "id,updatedAt",
  seasons: "id,updatedAt",
  computations: "id,updatedAt",
});
db.version(2).stores({
  sessions: "id,updatedAt",
  seasons: "id,updatedAt",
  computations: "id,updatedAt",
  accounts: "id,email,phone,createdAt",
});
