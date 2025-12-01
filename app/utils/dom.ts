/**
 * 根据id查找对话框的启动按钮
 * @param id
 */
function openModal(id: string) {
  document.getElementById(id)?.click();
}

/**
 * 根据id查找对话框的关闭按钮，不需要添加close前缀
 * @param id
 */
function closeModal(id: string) {
  document.getElementById("close-" + id)?.click();
}

export { openModal, closeModal };
