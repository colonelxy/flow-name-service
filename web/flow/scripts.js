import * as fcl from "@onflow/fcl";

export async function checkIsInitialized(addr) {
    return fcl.query({
        cadence: IS_INITIALIZED,
        args: (arg, t) => [arg(addr, t.Address)],
    });
}

const IS_INITIALIZED = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

pub fun main(account: Address): Bool {
    let capability = getAccount(account).getCappability<&Domains.Collection{NonFungibleToken.CollectionPublic, Domains.CollectionPublic}>(Domains.DomainsPublicPath)
    return capability.check()
}
`;