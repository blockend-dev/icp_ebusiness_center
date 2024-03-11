import {
  Canister,
  Record,
  text,
  nat8,
  nat16,
  nat64,
  Principal,
  Opt,
  None,
  Some,
  Variant,
  StableBTreeMap,
  update,
  query,
  Result,
  ic,
  Vec,
  init,
  Err,
} from "azle";
import { v4 as uuidv4 } from "uuid";
/**
 * This represents the business the user is opening
 */
const ownerOfBusiness=Record({
  name:text,
  productsSelling:text,
  labelofProduct:text,
  price:nat64,
  ownedby:text,
  location:text,
  country:text,
  continent:text,
  zipcode:text,
  description:text,
  listedAt:nat64,
  updatedAt:Opt(nat64)
});
/**
 * thsi type represent business listing
 */
const businessListing=Record({
  id:text,
  business:ownerOfBusiness,
  listedBy:Principal,
  listedAt:nat64,
  updatedAt:Opt(nat64)
})
type businessListing=typeof businessListing.tsType;
/**
 * this represents the user business payload
 */
const BusinessPayload=Record({
  name:text,
  location:text,
  zipcode:text,
  continent:text,
  country:text,
  labelofProduct:text,
  price:nat64,
  itemName:text,
  description:text
})
     
/**
 * comment by the user about the product he or she bought from the buyer
 */
const commentbyBuyer=Record({
  sellerId:Principal,
  itemId:text,
  comment:text,
  rate:nat64,
  listedAt:nat64,
})
/**
 * comment listing
 */
const commentListing=Record({
  id:text,
  comment:commentbyBuyer,
  listedBy:Principal,
  timeListed:nat64
})
/**
 * comments payload
 */
const commentsPayload=Record({
  sellerdId:Principal,
  itemId:text,
  comment:text,
  rate:nat64
})
type commentListing=typeof commentListing.tsType;
/**
 * this type represents different errors
 */
const Error=Variant({
  NotFound:text,
  BadRequest:text,
  Forbidden:text
})

//storage variables
const businessListingS=StableBTreeMap<text,businessListing>(0);
const accounts=StableBTreeMap<Principal,nat64>(0);
const soldItem=StableBTreeMap<text,Principal>(0);
const commentsOnItems=StableBTreeMap<text,commentListing>(0);
export default Canister({
  /**
   * initialize the canister and get register the user
   * intialize accounts
   */

  /**
   * @param payload Payload for listing business
   * @returns creates user business or error
   */
  createBusiness:update([BusinessPayload],Result(businessListing,Error),(payload)=>{
    //check if there are missing values
    if(!payload.name){
      return Result.Err({BadRequest:"name of busines is missing"});
    }
    if(!payload.continent){
      return Result.Err({BadRequest:"continent where business id located is missing"});
    }
    if(!payload.country){
      return Result.Err({BadRequest:"country where business id located is missing"});
    }
    if(!payload.location){
      return Result.Err({BadRequest:"location where business id located is missing"});
    }
    if(!payload.zipcode){
      return Result.Err({BadRequest:"zipcode where business id located is missing"});
    }
    if(!payload.labelofProduct){
      return Result.Err({BadRequest:"label of product is missing"});
    }
    if(!payload.description){
      return Result.Err({BadRequest:"description of product is missing"});
    }
    if(!payload.itemName){
      return Result.Err({BadRequest:"item name of product is missing"});
    }
    if(!payload.price){
      return Result.Err({BadRequest:"price of product is missing"});
    }
    //generate business listing
    const id=uuidv4();
    const businessListing:businessListing={
      id:id,
      business:{
        name:payload.name,
        productsSelling:payload.itemName,
        labelofProduct:payload.labelofProduct,
        price:payload.price,
        ownedby:payload.name,
        location:payload.location,
        country:payload.country,
        continent:payload.continent,
        zipcode:payload.zipcode,
        description:payload.description,
        listedAt:ic.time(),
        updatedAt:None
      },
      listedBy:ic.caller(),
      listedAt:ic.time(),
      updatedAt:None,
    };
    businessListingS.insert(businessListing.id,businessListing);
    return Result.Ok(businessListing);
  }),
  /**
   * list all available business and their full details
   * @returns list of all available business
   */
  getAllBusiness:query([],Vec(businessListing),()=>{
    return businessListingS.values()!;
  }),
  /**
   * search specific business
   * @returns specific business
   * @params pass business id
   */
  getSpecificBusiness:query([text],Result(businessListing,Error),(name)=>{
    if(!name){
      return Result.Err({BadRequest:"name of business is missing"});
    }
    const getItem=businessListingS.get(name);
    if(getItem.None){
      return Result.Err({BadRequest:"no business with that id if found"});
    }
    return Result.Ok(businessListingS.get(name).Some!);
  }),
  /**
   * allow seller to delete a product
   * @params pass id of an item you want to delete
   * @returns error if any and deleted item
   */
  sellerDeleteProduct:update([text],Result(businessListing,Error),(itemId)=>{
    //verify if its seller
    //locate an item
   // const itemOption = businessListingS.get(itemId);
    // if (itemOption.len<=0) {
    //    return Result.Err({ NotFound: "Item with that ID is not found" });
    // }
    if(!itemId){
      return Result.Err({BadRequest:"item id is missing"});
    }
    //make sure that its only owner can delete the item 
  
   const removeItem=businessListingS.get(itemId).Some!;
   if(!removeItem){
    return Result.Err({BadRequest:"item id not found"});
   }
   if(removeItem.listedBy.toText()!=ic.caller().toText()){
     return Result.Err({Forbidden:"only seller can delete the product"}) 
  }
    businessListingS.remove(itemId);
    return Result.Ok(removeItem)
  }),


  /**
   * this is where the buyer can buy a product of interest
   * this also checks if the buyer has enough tokens to proceed with transctions
   * if the buyer doesnt have enough tokens it promots an errror
   * @params pass item id and pricipal id of seller
   * @returns item bought and error if any
   */
  buyProduct:update([text,Principal],Result(businessListing,Error),(itemId,to)=>{
    //check to make sure that is not the seller who is buying the product that he/she is selling
   const item=businessListingS.get(itemId).Some!;
   if(item.listedBy.toText()==ic.caller().toText()){
    return Result.Err({Forbidden:"seller cannot buy the product that he/she is actually selling "});
   }
   //check the balance to make sure the buyer has enough tokens
   const from=ic.caller();
   const fromBalance=getBalance(accounts.get(from));
   //get the price of product
   const itemPrice=item.business.price;
   if(itemPrice>fromBalance){
    return Result.Err({BadRequest:"you have insufficient tokens to proceed with transactions"})
   }
   //get seller balance
   const sellerBalance=getBalance(accounts.get(to));
   accounts.insert(from,fromBalance-itemPrice);
   accounts.insert(to,sellerBalance+itemPrice);
   soldItem.insert(item.id,from);
   //delete item from seller after buyer complete transactions
   businessListingS.remove(item.id);
   return Result.Ok(item);
  })
  ,
  /**
   * this is where the user can comment about the product he/she bought
   * @params seller pricipal id ,product id and comment
   * @returns parameters passed and error if any
   */
    buyerComments:update([commentsPayload],Result(commentListing,Error),(payload)=>{
      //check to make sure every field is filled with correct value
      if(!payload.sellerdId){
        return Result.Err({BadRequest:"seller id is missing"});
      }
      if(!payload.itemId){
        return Result.Err({BadRequest:"item id is missing"});
      }
      if(!payload.comment){
        return Result.Err({BadRequest:"comment is missing"});
      }
      if(!payload.rate){
        return Result.Err({BadRequest:"rate is missing"});
      }
      //check if item has been sold
      const getItem=soldItem.get(payload.itemId).Some!;
      if(!getItem){
        return Result.Err({BadRequest:"item with given id is missing"});
      }
      // const buyerid=soldItem.values()
      // check if its the buyer who actuallly bought the item
      // if(ic.caller().toText()!=getItem.)
      const id=uuidv4();
      const commentListing:commentListing={
        id:id,
        comment:{
          sellerId:payload.sellerdId,
          itemId:payload.itemId,
          comment:payload.comment,
          rate:payload.rate,
          listedAt:ic.time()
        },
        listedBy:ic.caller(),
        timeListed:ic.time()
      }
      commentsOnItems.insert(commentListing.id,commentListing);
      return Result.Ok(commentListing);
    })
    
});
function getBalance(accountOPT:Opt<nat64>):nat64{
  if('None' in accountOPT){
    return 0n;
  }
  else{
    return accountOPT.Some;
  }
}