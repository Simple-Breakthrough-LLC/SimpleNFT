#include <solana_sdk.h>

#define SYS_KEY "11111111111111111111111111111111"
#define RENT_SYSVAR "SysvarRent111111111111111111111111111111111"
#define SYS_ALLOCATE_TAG 8
#define SYS_CREATE_TAG 0
#define TOKEN_INIT_MINT_TAG 0
#define TOKEN_MINT_TO 7

// 
uint64_t createAccount(SolAccountInfo *creator, SolAccountInfo *newAccount, SolAccountInfo *program)
{
    SolAccountInfo accountInfo[2] = {creator, newAccount};
    SolAccountMeta instructionArgs[] = {{creator->key, true, true}, {newAccount->key, true, true}};
    uint8_t data[4 + sizeof(uint64_t) + sizeof(uint64_t) + sizeof(SolPubkey)];
    int dataOffset = 0;


    *(uint16_t *)(data + dataOffset) = SYS_CREATE_TAG;
    dataOffset += sizeof(uint16_t);
    *(uint64_t *)(data + dataOffset) = 0; //Lamports ?
    dataOffset += sizeof(uint64_t);
    *(uint64_t *)(data + dataOffset) = 0; //Token account size
    dataOffset += sizeof(uint64_t);
    *(SolPubkey *)(data + dataOffset) = *(program->key); //owner

    const SolInstruction createAccInstruction = {
            SYS_KEY, 
            instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
            data, SOL_ARRAY_SIZE(data)
        };
    
    sol_invoke(&createAccInstruction, accountInfo, SOL_ARRAY_SIZE(accountInfo));
}

//                       tokenProgramg  acount to initalize as mint , decimals        , this program
uint64_t createToken(SolPubkey tokenKey, SolAccountInfo *MintAccount, uint8_t decimals, SolPubkey authority, ) 
{
    uint8_t decimals;
    decimals = 6;// Pass this in data

    SolAccountInfo newAccount;
    SolAccountMeta instructionArgs[] = {{MintAccount, true, false}, {RENT_SYSVAR}};
    uint8_t data[4 + sizeof(uint8_t) + sizeof(SolPubkey) + sizeof(SolPubkey)];
    
    data = TOKEN_INIT_MINT_TAG;
    etc...
    const SolInstruction createTokenInstruction = {
            tokenKey, 
            instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
            data, SOL_ARRAY_SIZE(data)
        }
    
    // I still don't understand how the seed and signer seed work 
    // Token account & mint account as signers
    sol_invoke(&createTokenInstruction, SOL_ARRAY_SIZE(signer_seeds));
}

uint64_t createPDA_FromTokenAccount(SolAccountInfo *mintAccount, SolPubkey *programId, SolPubkey *PDA, 
                                    uint32_t initialSupply, uint8_t percentTaken_FromTansfers) 
{
    uint8_t bumpSeed;
    const SolSignerSeed seeds[] = {{mintAccount->key, sizeof(mintAccount->key)}};
    const SolSignerSeeds signers_seeds[] = {{seeds, SOL_ARRAY_SIZE(seeds)}};

    sol_try_find_program_address(seeds, SOL_ARRAY_SIZE(seeds), programId, PDA, &bumpSeed);
    // sol_find_program_address();
    // sol_cfind_program_address(); WHY ?
    if (SUCCESS != sol_create_program_address(
                    seeds, SOL_ARRAY_SIZE(seeds), 
                    &programId, PDA));
        return ERROR_INVALID_INSTRUCTION_DATA;
    
    SolAccountMeta instructionArgs[] = {{PDA, true, true}};
    uint8_t data[sizeof(SYS_ALLOCATE_TAG)+ 
                sizeof(initialSupply) + 
                sizeof(percentTaken_FromTansfers)];

    *(uint16_t *)data = SYS_ALLOCATE_TAG;
    *(uint64_t *)(data + sizeof(uint16_t)) = initialSupply;
    *(uint64_t *)(data + sizeof(uint16_t) + sizeof(uint64_t)) = percentTaken_FromTansfers;

    const SolInstruction allocateInstruction = {
                SYS_KEY, 
                instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
                data, SOL_ARRAY_SIZE(data)
                }
    sol_invoke_signed(&allocateInstruction, ??, ??, signer_seeds, SOL_ARRAY_SIZE(signer_seeds));
}

uint64_t mintSupply_ToCreator(SolAccountInfo *MintAccount, SolAccountInfo *CreatorAccount, SolPubkey tokenKey)
{   
    SolAccountMeta instructionArgs[] = {{MintAccount, CreatorAccount, "minting auhtority??"}};
    uint8_t data[sizeof(TOKEN_MINT_TO) + sizeof(uint64_t)];

    *(uint16_t *)data = TOKEN_MINT_TO;
    *(uint64_t *)(data + 4) = 100;

    const SolInstruction allocateInstruction = {
                tokenKey, 
                instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
                data, SOL_ARRAY_SIZE(data)
                };
    sol_invoke_signed(&allocateInstruction, ??, ??, signer_seeds, SOL_ARRAY_SIZE(signer_seeds));
}

uint64_t createNew_ReflectionToken (const uint8_t *input)
{
    SolPubkey PDA;
    SolAccountInfo accounts[5];
    SolParameters params = (SolParameters){.ka = accounts};

    if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
        return ERROR_INVALID_ARGUMENT;

    SolAccountInfo *program = &accounts[0];
    SolAccountInfo *systemProgram = &accounts[1];
    SolAccountInfo *tokenProgram = &accounts[2];
    SolAccountInfo *creatorAccount = &accounts[3];
    SolAccountInfo *newAccount = &accounts[4];
    SolAccountInfo *PDAAccount = &accounts[4];

    createAccount(creatorAccount, newAccount);
    createToken();
    createPDA_FromTokenAccount();
    mintSupply_ToCreator();
}

extern uint64_t entrypoint(const uint8_t *input)
{
    const char tag = input[0];

    if (tag == 0)
    {

        createNew_ReflectionToken(input)
        // DATA : supply, % taken from transfer, 
        // ACCOUNTS : program, sys , token, creator
        // TODO LATER (can be done in JS but prefer not to
        // [
        //      Create publicKey
        //      Create Account fromt key
        // ]
        
        //Create token account from previously create account
        // Porbably create metadata account with name, symbol
        //Create PDA from mint address with : % , supply
        //Mint 100 tokens to creator
    }
    else if (tag == 1)
    {

    }
    else return ERROR_INVALID_INSTRUCTION_DATA;
}

