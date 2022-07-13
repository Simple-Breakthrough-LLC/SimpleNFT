use std::convert::TryInto;
use solana_program::program_error::ProgramError;

use crate::error::ReflectionError::InvalidInstruction;

pub enum ReflectionInstruction {
	/// Creates a new reflection token.
	///
	/// 0. `[]` The system program
	/// 1. `[]` The token program
	/// 2. `[]` The associated token program
	/// 3. `[signer]` Owner of the newly created token
	/// 4. `[signer]` The mint account of the newly created token
	/// 5. `[writable]` The PDA account of the newly created reflection token
	/// 6. `[writable]` The associated token account that will hold the owner's initial mint
	CreateToken {
		total_supply: u64,
		transfer_fee_percent: u64,
	},
}

impl ReflectionInstruction {
	/// Unpacks a byte buffer into a [ReflectionInstruction](enum.ReflectionInstruction.html).
	pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
		let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
		// Split one more byte since tag is u16
		let (_, rest) = rest.split_first().ok_or(InvalidInstruction)?;

		Ok(match tag {
			0 => {
				let (total_supply, rest) = Self::unpack_u64(rest)?;
				let (transfer_fee_percent, _rest) = Self::unpack_u64(rest)?;
				Self::CreateToken {
					total_supply,
					transfer_fee_percent,
				}
			},
			_ => return Err(InvalidInstruction.into()),
		})
	}

	pub fn unpack_u64(input: &[u8]) -> Result<(u64, &[u8]), ProgramError> {
		let value = input
			.get(..8)
			.and_then(|slice| slice.try_into().ok())
			.map(u64::from_le_bytes)
			.ok_or(InvalidInstruction)?;
		Ok((value, &input[8..]))
	}
}
