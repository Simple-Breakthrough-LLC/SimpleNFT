#include <solana_sdk.h>

#define SYS_KEY "11111111111111111111111111111111"
#define RENT_SYSVAR "SysvarRent111111111111111111111111111111111"
#define SYS_ALLOCATE_TAG 8
#define SYS_CREATE_TAG 0
#define TOKEN_INIT_MINT_TAG 0
#define TOKEN_MINT_TO 7
#define TOKEN_ACC_SIZE 165

extern uint64_t sol_get_rent_sysvar(void *ret);
typedef struct
{
    uint64_t lamports_per_byte_year;

    uint8_t exemption_threshold[8];

    uint8_t burn_percent;

} Rent;

// Function missing from solana_sdk.h
extern uint64_t sol_get_rent_sysvar(void *ret);

// 105,290,880 = 19.055441478439427 (fee rate) * (128 + 15_000)(account size including metadata) * ((365.25/2) * 2)(epochs in 2 years)
static uint64_t get_rent_exempt_minimum(uint64_t account_size)
{
    // Get the rent sysvar value
    Rent rent;
    uint64_t result = sol_get_rent_sysvar(&rent);

    // Unfortunately the exemption threshold is in f64 format.  This makes it super difficult to work with since
    // BPF doesn't have floating point instructions.  So do manual computation using the bits of the floating
    // point value.
    uint64_t u = * (uint64_t *) rent.exemption_threshold;
    uint64_t exp = ((u >> 52) & 0x7FF);

    if (result || // sol_get_rent_sysvar failed, so u and exp are bogus
        (u & 0x8000000000000000ULL) || // negative exemption_threshold
        ((exp == 0) || (exp == 0x7FF))) { // subnormal values
        // Unsupported and basically nonsensical rent exemption threshold.  Just use some hopefully sane default based
        // on historical values that were true for 2021/2022: lamports_per_byte_year = 3480, exemption_threshold = 2
        // years
        return (account_size + 128) * 3480 * 2;
    }

    // 128 bytes are added for account overhead
    uint64_t min = (account_size + 128) * rent.lamports_per_byte_year;
        
    if (exp >= 1023) {
        min *= (1 << (exp - 1023));
    }
    else {
        min /= (1 << (1023 - exp));
    }
    
    uint64_t fraction = u & 0x000FFFFFFFFFFFFFULL;
    
    // Reduce fraction to 10 bits, to avoid overflow.  Keep track of whether or not to round up.
    bool round_up = (fraction & 0x3FFFFFFFFFFULL);
    
    fraction >>= 42;
    if (round_up) {
        fraction += 1;
    }
   
    fraction *= min;
    fraction /= 0x3FF;
    
    return min + fraction;
}

// 
uint64_t createAccount(SolAccountInfo *creator, SolAccountInfo *newAccount, SolAccountInfo *program)
{
    SolAccountInfo *accounts[2] = {creator, newAccount};
    SolAccountMeta instructionArgs[] = {{creator->key, true, true}, {newAccount->key, true, true}};
    uint8_t data[4 + sizeof(uint64_t) + sizeof(uint64_t) + sizeof(SolPubkey)];
    int dataOffset = 0;


    *(uint16_t *)(data + dataOffset) = SYS_CREATE_TAG;
    dataOffset += sizeof(uint16_t);
    *(uint64_t *)(data + dataOffset) = get_rent_exempt_minimum(TOKEN_ACC_SIZE); //Lamports ?
    dataOffset += sizeof(uint64_t);
    *(uint64_t *)(data + dataOffset) = TOKEN_ACC_SIZE; //Token account size
    dataOffset += sizeof(uint64_t);
    *(SolPubkey *)(data + dataOffset) = *(program->key); //owner

    const SolInstruction createAccInstruction = {
            SYS_KEY, 
            instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
            data, SOL_ARRAY_SIZE(data)
        };
    
    sol_invoke(&createAccInstruction, accounts, SOL_ARRAY_SIZE(accounts));
}

//                       tokenProgramg  acount to initalize as mint , decimals        , this program
uint64_t createToken( SolAccountInfo *MintAccount, uint8_t decimals, SolAccountInfo *authority, SolAccountInfo *tokenProgram) 
{
    uint8_t decimals;
    SolAccountInfo *accounts[2] = {MintAccount, authority, tokenProgram};
    SolAccountMeta instructionArgs[] = {{MintAccount, true, false}, {RENT_SYSVAR}};
    uint8_t data[4 + sizeof(uint8_t) + sizeof(SolPubkey) + sizeof(SolPubkey)];
    int dataOffset = 0;

    
    decimals = 6;// Pass this in data
    *(uint16_t *)(data + dataOffset) = TOKEN_INIT_MINT_TAG;
    dataOffset += sizeof(uint16_t);
    *(SolPubkey*)(data + dataOffset) = *(MintAccount->key);
    dataOffset += sizeof(SolPubkey);
    *(SolPubkey*)(data + dataOffset) = *(authority->key);

    const SolInstruction createTokenInstruction = {
            tokenProgram->key, 
            instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
            data, SOL_ARRAY_SIZE(data)
        };

    sol_invoke(&createTokenInstruction, accounts, SOL_ARRAY_SIZE(accounts));
}

uint64_t createPDA_FromTokenAccount(SolAccountInfo *mintAccount, SolAccountInfo *program, SolAccountInfo *PDA, SolAccountInfo *system,
                                    uint32_t initialSupply, uint8_t percentTaken_FromTansfers) 
{
    uint8_t bumpSeed;
    const SolSignerSeed seeds[] = {{mintAccount->key, sizeof(mintAccount->key)}};
    const SolSignerSeeds signers_seeds[] = {{seeds, SOL_ARRAY_SIZE(seeds)}};

// ?
    sol_try_find_program_address(seeds, SOL_ARRAY_SIZE(seeds), program->key, PDA->key, &bumpSeed);

    if (SUCCESS != sol_create_program_address(
                    seeds, SOL_ARRAY_SIZE(seeds), 
                    &program, PDA));
        return ERROR_INVALID_INSTRUCTION_DATA;
 // 
    SolAccountInfo *accounts[2] = {system, PDA};
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
                };

    sol_invoke_signed(&allocateInstruction, accounts, SOL_ARRAY_SIZE(accounts), signers_seeds, SOL_ARRAY_SIZE(signers_seeds));
}

uint64_t mintSupply_ToCreator(SolAccountInfo *MintAccount, SolAccountInfo *CreatorAccount, SolAccountInfo *tokenProgram, SolAccountInfo *PDA)
{   
    SolAccountInfo *accounts[] = {MintAccount, CreatorAccount, tokenProgram};
    SolAccountMeta instructionArgs[] = {{MintAccount->key}, {CreatorAccount->key}, {PDA->key}};
    uint8_t data[sizeof(TOKEN_MINT_TO) + sizeof(uint64_t)];

    *(uint16_t *)data = TOKEN_MINT_TO;
    *(uint64_t *)(data + 4) = 100;

    const SolInstruction allocateInstruction = {
                tokenProgram->key, 
                instructionArgs, SOL_ARRAY_SIZE(instructionArgs),
                data, SOL_ARRAY_SIZE(data)
                };
    sol_invoke(&allocateInstruction, accounts, SOL_ARRAY_SIZE(accounts));
}

typedef struct t_data
{
    uint64_t supply;
    uint64_t percentFromTransfers;
}               Data;

uint64_t createNew_ReflectionToken (const uint8_t *input)
{
    SolAccountInfo accounts[5];
    SolParameters params = (SolParameters){.ka = accounts};
    Data data;
    if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
        return ERROR_INVALID_ARGUMENT;

    data = *(Data *)params.data;
    SolAccountInfo *program = &accounts[0];
    SolAccountInfo *systemProgram = &accounts[1];
    SolAccountInfo *tokenProgram = &accounts[2];
    SolAccountInfo *creatorAccount = &accounts[3];
    SolAccountInfo *newAccount = &accounts[4];
    SolAccountInfo *PDAAccount = &accounts[4];

    createAccount(creatorAccount, newAccount, program);
    createToken(newAccount, 6, program, tokenProgram);
    createPDA_FromTokenAccount(newAccount, program, PDAAccount, systemProgram, data.supply, data.percentFromTransfers);
    mintSupply_ToCreator(newAccount, creatorAccount, tokenProgram, PDAAccount);
}

extern uint64_t entrypoint(const uint8_t *input)
{
    const char tag = input[0];

    if (tag == 0)
    {

        createNew_ReflectionToken(input);
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