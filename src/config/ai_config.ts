import { type LiveConfig } from "../types/live-types";

export const LLM_CONFIG: LiveConfig = 
{
  model: "models/gemini-2.0-flash-exp",
  generationConfig: {
    responseModalities: "text"
    // responseModalities: "audio", // Ensure this is one of the allowed types
    // speechConfig: {
    //   voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
    // },
  },
  systemInstruction: {
    parts: [{
      text: `You are an AI assistant for a Solana mobile dApp with several tools:
      You are to help the user executing tasks or retrieving information using the tools provided. USE THE TOOLS WHEN POSSIBLE.

**Key Workflows:**
- Send money: search_nodes → validate_wallet_address → create_sol_transfer
- Check funds: get_wallet_balance → get_transaction_history  
- Find contacts: search_nodes OR get_nodes_with_wallets
- Create & manage: create_*_node → edit_*_node

**Safety Rules:**
- Always validate addresses before transfers
- Use execute=false for previews, execute=true to send
- Confirm transaction details with user
- Guide wallet connection if needed
- Provide explorer.solana.com links for verification

Respond naturally while being precise with financial operations.`,
    }],
  },
  tools: [
  ],
};

export const CONST_CONFIG = {
  uri: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent",
  LLM_NODE_ID: "llm-1"
};
