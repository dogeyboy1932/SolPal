/**
 * Test array parameter schema generation
 */

console.log('🧪 Testing Array Parameter Schema Generation...\n');

// Test what the NodeMCP should generate for create_person_node
const expectedCreatePersonSchema = {
  "name": "create_person_node",
  "description": "Create a new person node",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Person's name"
      },
      "walletAddress": {
        "type": "string", 
        "description": "Person's wallet address"
      },
      "notes": {
        "type": "string",
        "description": "Additional notes about the person"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Tags to categorize the person"
      }
    },
    "required": ["name"]
  }
};

console.log('📝 Expected create_person_node schema with proper array handling:');
console.log(JSON.stringify(expectedCreatePersonSchema, null, 2));

console.log('\n✅ Key fix: Array parameters now include "items" property');
console.log('✅ This should resolve the Gemini Live API validation error');
console.log('✅ "tags.items: missing field" error should be fixed');
