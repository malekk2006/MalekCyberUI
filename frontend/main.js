async function generateCodeAI() {
  const language = document.getElementById("langSelect").value;
  const projectName = document.getElementById("projectName").value;
  const author = document.getElementById("author").value;
  const description = prompt("صف الكود المطلوب:") || "";
  if (!description) return;

  const res = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, description, projectName, author })
  });

  const data = await res.json();
  document.getElementById("code").value = data.code || "خطأ!";
}

document.getElementById("aiBtn").addEventListener("click", generateCodeAI);
