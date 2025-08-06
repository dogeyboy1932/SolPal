import { EventNode, PersonNode } from '@/types/nodes';
import { nodeService } from './nodeService';

class NftService {
  async mintEventNFT(
    event: EventNode,
    person: PersonNode
  ): Promise<string | null> {
    if (
      event.mintedNFTs &&
      event.maxAttendees &&
      event.mintedNFTs.length >= event.maxAttendees
    ) {
      console.log('Event is full');
      return null;
    }

    // Mock minting process
    const newNftMintAddress = `mock_nft_${Date.now()}`;
    console.log(
      `Minting NFT for event ${event.name} for user ${person.name}...`
    );

    // Update event with new NFT
    const updatedEvent = {
      ...event,
      mintedNFTs: [...(event.mintedNFTs || []), newNftMintAddress],
    };
    if (nodeService.updateEventNode) {
      await nodeService.updateEventNode(event.id, updatedEvent);
    }

    // Update person with new NFT
    const updatedPerson = {
      ...person,
      ownedNFTs: [...(person.ownedNFTs || []), newNftMintAddress],
    };
    if (nodeService.updatePersonNode) {
      await nodeService.updatePersonNode(person.id, updatedPerson);
    }

    return newNftMintAddress;
  }
}

export const nftService = new NftService();
