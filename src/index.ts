/**
 * Represents a business owned by a user.
 */
const OwnerOfBusiness = Record({
  name: text,
  productsSelling: text,
  labelOfProduct: text,
  price: nat64,
  ownedBy: text,
  location: text,
  country: text,
  continent: text,
  zipcode: text,
  description: text,
  listedAt: nat64,
  updatedAt: Opt(nat64),
});

/**
 * Represents a business listing.
 */
const BusinessListing = Record({
  id: text,
  business: OwnerOfBusiness,
  listedBy: Principal,
  listedAt: nat64,
  updatedAt: Opt(nat64),
});
type BusinessListing = typeof BusinessListing.tsType;

/**
 * Represents the payload for creating a business.
 */
const BusinessPayload = Record({
  name: text,
  location: text,
  zipcode: text,
  continent: text,
  country: text,
  labelOfProduct: text,
  price: nat64,
  itemName: text,
  description: text,
});

/**
 * Represents a comment made by a buyer about a product.
 */
const CommentByBuyer = Record({
  sellerId: Principal,
  itemId: text,
  comment: text,
  rate: nat64,
  listedAt: nat64,
});

/**
 * Represents a comment listing.
 */
const CommentListing = Record({
  id: text,
  comment: CommentByBuyer,
  listedBy: Principal,
  timeListed: nat64,
});
type CommentListing = typeof CommentListing.tsType;

/**
 * Represents different error types.
 */
const Error = Variant({
  NotFound: text,
  BadRequest: text,
  Forbidden: text,
});

/**
 * Storage variables.
 */
const businessListings = StableBTreeMap<text, BusinessListing>(0);
const accounts = StableBTreeMap<Principal, nat64>(0);
const soldItems = StableBTreeMap<text, Principal>(0);
const commentsOnItems = StableBTreeMap<text, CommentListing>(0);

export default Canister({
  /**
   * Create a business with the given payload.
   * @param {BusinessPayload} payload - Payload for creating a business.
   * @returns {Result<BusinessListing, Error>} - Result of the operation.
   */
  createBusiness: update([BusinessPayload], Result(BusinessListing, Error), (payload) => {
    // Check if there are missing values
    const missingFields = [];
    if (!payload.name) missingFields.push("business name");
    if (!payload.continent) missingFields.push("continent");
    // Add checks for other required fields here...

    if (missingFields.length > 0) {
      return Result.Err({ BadRequest: `Missing required fields: ${missingFields.join(", ")}` });
    }

    // Generate business listing
    const id = uuidv4();
    const newBusinessListing: BusinessListing = {
      id,
      business: {
        name: payload.name,
        productsSelling: payload.itemName,
        labelOfProduct: payload.labelOfProduct,
        price: payload.price,
        ownedBy: payload.name,
        location: payload.location,
        country: payload.country,
        continent: payload.continent,
        zipcode: payload.zipcode,
        description: payload.description,
        listedAt: ic.time(),
        updatedAt: None,
      },
      listedBy: ic.caller(),
      listedAt: ic.time(),
      updatedAt: None,
    };
    businessListings.insert(id, newBusinessListing);
    return Result.Ok(newBusinessListing);
  }),

  /**
   * List all available businesses.
   * @returns {Vec<BusinessListing>} - List of all available businesses.
   */
  getAllBusiness: query([], Vec(BusinessListing), () => {
    return businessListings.values()!;
  }),

  /**
   * Get a specific business by ID.
   * @param {text} id - Business ID.
   * @returns {Result<BusinessListing, Error>} - Result of the operation.
   */
  getSpecificBusiness: query([text], Result(BusinessListing, Error), (id) => {
    const business = businessListings.get(id);
    if (business.isNone()) {
      return Result.Err({ NotFound: "No business with that ID was found." });
    }
    return Result.Ok(business.unwrap());
  }),

  /**
   * Allow a seller to delete their product.
   * @param {text} itemId - ID of the item to be deleted.
   * @returns {Result<BusinessListing, Error>} - Result of the operation.
   */
  sellerDeleteProduct: update([text], Result(BusinessListing, Error), (itemId) => {
    const business = businessListings.get(itemId);
    if (business.isNone()) {
      return Result.Err({ NotFound: "Item with that ID is not found." });
    }

    const listing = business.unwrap();
    if (listing.listedBy.toText() !== ic.caller().toText()) {
      return Result.Err({ Forbidden: "Only the seller can delete the product." });
    }

    businessListings.remove(itemId);
    return Result.Ok(listing);
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
