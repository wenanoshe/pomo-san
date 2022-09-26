export function addToLocalStorage(name, data, timestamp) {
  localStorage.setItem(name, { ...data, timestamp });
}
