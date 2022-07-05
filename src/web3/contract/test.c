typedef unsigned char uint8_t;
#define SOL_ARRAY_SIZE(a) (sizeof(a) / sizeof(a[0]))
#include <stdio.h>

int main(void)
{
    uint8_t seed[] = "You pass butter";

    printf("%s size %ld", seed, SOL_ARRAY_SIZE(seed));

    return 1;
}