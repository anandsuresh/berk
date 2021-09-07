import { berk } from "../../declarations/berk";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with berk actor, calling the greet method
  const greeting = await berk.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
