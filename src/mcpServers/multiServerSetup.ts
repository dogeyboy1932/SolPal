// COMMENTED OUT - Using single combined server instead
// Multi-server setup disabled per user request

// Placeholder exports to prevent import errors
export async function connectToDefaultMCPServers() {
  console.log('⚠️ Multi-server setup is disabled');
  return [];
}

export function getAllMCPClients() {
  return [];
}

export function getAllMCPTools() {
  return [];
}

export async function connectToMCPServer() {
  return [];
}

export async function executeMCPTool() {
  throw new Error('Multi-server setup is disabled');
}

export function disconnectAllMCPServers() {
  console.log('Multi-server setup is disabled');
}
