const onMessageDisplay = async () => {
  await browser.runtime.sendMessage({
    command: "onMessageDisplay",
  });
};

onMessageDisplay();
console.log("on message display!");