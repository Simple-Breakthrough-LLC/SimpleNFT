use solana_program::{
	account_info::{next_account_info, AccountInfo},
	entrypoint::ProgramResult,

	msg,
	pubkey::Pubkey,
	program_pack::Pack,
	sysvar::{rent::Rent, Sysvar},
	program::{invoke, invoke_signed},
	system_instruction,
};
use spl_token::{
	instruction::{initialize_mint2, mint_to, freeze_account},
	state::Mint as TokenMint,
	state::Account as TokenAccount,
};
use spl_associated_token_account::instruction::create_associated_token_account;

use crate::{instruction::ReflectionInstruction, error::ReflectionError, state::Reflection};

pub struct Processor;
impl Processor {
	pub fn process(
		program_id: &Pubkey,
		accounts: &[AccountInfo],
		instruction_data: &[u8]
	) -> ProgramResult {
		let instruction = ReflectionInstruction::unpack(instruction_data)?;

		match instruction {
			ReflectionInstruction::CreateToken { total_supply, transfer_fee_percent } => {
				msg!("Instruction: CreateToken");
				Self::process_create_token(accounts, total_supply, transfer_fee_percent, program_id)
			}
		}
	}

	fn process_create_token(
		accounts: &[AccountInfo],
		total_supply: u64,
		transfer_fee_percent: u64,
		program_id: &Pubkey
	) -> ProgramResult {
		let account_info_iter = &mut accounts.iter();
		let system_program = next_account_info(account_info_iter)?;
		let token_program = next_account_info(account_info_iter)?;
		let associated_token_program = next_account_info(account_info_iter)?;
		let owner = next_account_info(account_info_iter)?;
		let mint_account = next_account_info(account_info_iter)?;
		let reflection_pda = next_account_info(account_info_iter)?;
		let associated_token_pda = next_account_info(account_info_iter)?;
		let (pda, bump_seed) = Pubkey::find_program_address(&[&mint_account.key.to_bytes()], program_id);
		if pda != *reflection_pda.key {
			return Err(ReflectionError::InvalidProgramAddress.into());
		}

		let rent = Rent::get()?;

		// Allocate reflection pda
		let initialize_reflection_ix = system_instruction::allocate(
			reflection_pda.key,
			Reflection::LEN as u64,
		);
		msg!("Calling the system program to initialize reflection pda.");
		invoke_signed(
			&initialize_reflection_ix,
			&[
				reflection_pda.clone(),
				system_program.clone(),
			],
			&[&[&mint_account.key.to_bytes(), &[bump_seed]]]
		)?;

		// Assign reflection pda
		let initialize_reflection_ix = system_instruction::assign(
			reflection_pda.key,
			program_id,
		);
		msg!("Calling the system program to assign ownership of the reflection pda.");
		invoke_signed(
			&initialize_reflection_ix,
			&[
				reflection_pda.clone(),
				system_program.clone(),
			],
			&[&[&mint_account.key.to_bytes(), &[bump_seed]]]
		)?;

		// Make reflection pda rent exempt
		let required_lamports = rent.minimum_balance(Reflection::LEN).max(1);
		let transfer_lamports_ix = system_instruction::transfer(
			owner.key,
			reflection_pda.key,
			required_lamports,
		);
		msg!("Transfering required lamports for rent exemption.");
		invoke(
			&transfer_lamports_ix,
			&[
				owner.clone(),
				reflection_pda.clone(),
				system_program.clone(),
			],
		)?;

		// Create mint
		let create_ix = system_instruction::create_account(
			owner.key,
			mint_account.key,
			rent.minimum_balance(TokenMint::get_packed_len()),
			TokenMint::get_packed_len() as u64,
			token_program.key,
		);
		msg!("Calling the system program to create account.");
		invoke(
			&create_ix,
			&[
				owner.clone(),
				mint_account.clone(),
				system_program.clone(),
			],
		)?;

		// Initialize mint
		let initialize_mint_ix = initialize_mint2(
			token_program.key,
			mint_account.key,
			reflection_pda.key,
			Some(reflection_pda.key),
			6
		)?;
		msg!("Calling the token program to initialize mint.");
		invoke(
			&initialize_mint_ix,
			&[
				mint_account.clone(),
				token_program.clone(),
			],
		)?;

		// Create associated token account
		let create_token_account_ix = create_associated_token_account(
			owner.key,
			owner.key,
			mint_account.key,
		);
		msg!("Calling the associated token program to create an associated token account.");
		invoke(
			&create_token_account_ix,
			&[
				associated_token_pda.clone(),
				mint_account.clone(),
				owner.clone(),
				associated_token_program.clone(),
			],
		)?;

		// Mint initial supply
		let mint_to_ix = mint_to(
			token_program.key,
			mint_account.key,
			associated_token_pda.key,
			reflection_pda.key,
			&[reflection_pda.key],
			total_supply,
		)?;
		msg!("Calling the token program to mint the initial supply.");
		invoke_signed(
			&mint_to_ix,
			&[
				token_program.clone(),
				associated_token_pda.clone(),
				reflection_pda.clone(),
				mint_account.clone(),
			],
			&[&[&mint_account.key.to_bytes(), &[bump_seed]]]
		)?;

		// Freeze account
		let freeze_ix = freeze_account(
			token_program.key,
			associated_token_pda.key,
			mint_account.key,
			reflection_pda.key,
			&[reflection_pda.key],
		)?;
		msg!("Calling the token program to freeze the token account.");
		invoke_signed(
			&freeze_ix,
			&[
				token_program.clone(),
				associated_token_pda.clone(),
				mint_account.clone(),
				reflection_pda.clone(),
			],
			&[&[&mint_account.key.to_bytes(), &[bump_seed]]]
		)?;

		// Update reflection PDA data
		let mut reflection_info = Reflection::unpack_unchecked(&reflection_pda.try_borrow_data()?)?;
		reflection_info.total_supply = total_supply;
		reflection_info.transfer_fee_percent = transfer_fee_percent;
		Reflection::pack(reflection_info, &mut reflection_pda.try_borrow_mut_data()?)?;

		Ok(())
	}
}
