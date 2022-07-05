import { VoteType, VoteTypeKind } from '@solana/spl-governance/lib/governance/accounts';
import { Vote, VoteChoice, VoteKind } from '@solana/spl-governance/lib/governance/instructions';
import { BinaryReader, BinaryWriter } from 'borsh';

// Functions stolen from @solana/spl-governance/lib/governance/serialization.js
export const extendBorsh = () => {
	// ------------ u16 ------------
	// Temp. workaround to support u16.
	BinaryReader.prototype.readU16 = function () {
	    const reader = this;
	    const value = reader.buf.readUInt16LE(reader.offset);
	    reader.offset += 2;
	    return value;
	};
	// Temp. workaround to support u16.
	BinaryWriter.prototype.writeU16 = function (value) {
	    const writer = this;
	    writer.maybeResize();
	    writer.buf.writeUInt16LE(value, writer.length);
	    writer.length += 2;
	};
	// ------------ VoteType ------------
	(BinaryReader.prototype as any).readVoteType = function () {
	    const reader = this;
	    const value = reader.buf.readUInt8(reader.offset);
	    reader.offset += 1;
	    if (value === VoteTypeKind.SingleChoice) {
	        return VoteType.SINGLE_CHOICE;
	    }
	    const choiceCount = reader.buf.readUInt16LE(reader.offset);
	    return VoteType.MULTI_CHOICE(choiceCount);
	};
	(BinaryWriter.prototype as any).writeVoteType = function (value: VoteType) {
	    const writer = this;
	    writer.maybeResize();
	    writer.buf.writeUInt8(value.type, writer.length);
	    writer.length += 1;
	    if (value.type === VoteTypeKind.MultiChoice) {
	        writer.buf.writeUInt16LE(value.choiceCount, writer.length);
	        writer.length += 2;
	    }
	};
	// ------------ Vote ------------
	(BinaryReader.prototype as any).readVote = function () {
	    const reader = this;
	    const value = reader.buf.readUInt8(reader.offset);
	    reader.offset += 1;
	    if (value === VoteKind.Deny) {
	        return new Vote({ voteType: value, approveChoices: undefined, deny: true });
	    }
	    let approveChoices: any;
	    reader.readArray(() => {
	        const rank = reader.buf.readUInt8(reader.offset);
	        reader.offset += 1;
	        const weightPercentage = reader.buf.readUInt8(reader.offset);
	        reader.offset += 1;
	        approveChoices.push(new VoteChoice({ rank: rank, weightPercentage: weightPercentage }));
	    });
	    return new Vote({
	        voteType: value,
	        approveChoices: approveChoices,
	        deny: undefined,
	    });
	};
	(BinaryWriter.prototype as any).writeVote = function (value: Vote) {
	    const writer = this;
	    writer.maybeResize();
	    writer.buf.writeUInt8(value.voteType, writer.length);
	    writer.length += 1;
	    if (value.voteType === VoteKind.Approve) {
	        writer.writeArray(value.approveChoices, (item: any) => {
	            writer.buf.writeUInt8(item.rank, writer.length);
	            writer.length += 1;
	            writer.buf.writeUInt8(item.weightPercentage, writer.length);
	            writer.length += 1;
	        });
	    }
	};
}

extendBorsh();