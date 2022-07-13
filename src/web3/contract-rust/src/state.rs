use solana_program::{
    program_pack::{Pack, Sealed},
	program_error::ProgramError,
};

pub struct Reflection {
	pub total_supply: u64,
	pub transfer_fee_percent: u64,
}

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

impl Sealed for Reflection { }

impl Pack for Reflection {
	const LEN: usize = 16;
	fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
		let src = array_ref![src, 0, Reflection::LEN];
		let (
			total_supply,
			transfer_fee_percent,
		) = array_refs![src, 8, 8];

		Ok(Reflection{
			total_supply: u64::from_le_bytes(*total_supply),
			transfer_fee_percent: u64::from_le_bytes(*transfer_fee_percent),
		})
	}

	fn pack_into_slice(&self, dst: &mut [u8]) {
		let dst = array_mut_ref![dst, 0, Reflection::LEN];
		let (
			total_supply_dst,
			transfer_fee_percent_dst,
		) = mut_array_refs![dst, 8, 8];

		let Reflection {
			total_supply,
			transfer_fee_percent,
		} = self;

		*total_supply_dst = total_supply.to_le_bytes();
		*transfer_fee_percent_dst = transfer_fee_percent.to_le_bytes();
	}
}
