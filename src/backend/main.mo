import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Outcall "http-outcalls/outcall";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
    email : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  public type OtpResult = {
    ok : Bool;
    message : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // OTP storage: phone -> (otp_code, timestamp_nanos)
  let otpStore = Map.empty<Text, (Text, Int)>();

  // API key hardcoded - Fast2SMS via RapidAPI
  stable var FAST2SMS_KEY : Text = "WgdHqBXG1a5mSyR7913xgj1bl8OEEsRn0KDpkPjG3gdlPXmpxJtEzGEVTtJp";
  let OTP_EXPIRY_NANOS : Int = 5 * 60 * 1_000_000_000; // 5 minutes

  public shared func setSmsApiKey(key : Text) : async () {
    FAST2SMS_KEY := key;
  };

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  public shared func sendOtp(phone : Text) : async OtpResult {
    if (FAST2SMS_KEY == "") {
      return { ok = false; message = "SMS API key configure nahi hai." };
    };

    let now = Time.now();
    let seed = Int.abs(now) % 900000 + 100000;
    let code = seed.toText();

    otpStore.add(phone, (code, now));

    let msgBody = "Your Flipchat OTP is: " # code # ". Valid for 5 minutes. Do not share with anyone.";
    let jsonBody = "{\"sender_id\":\"TXTIND\",\"message\":\"" # msgBody # "\",\"variables_values\":\"" # code # "\",\"route\":\"otp\",\"numbers\":\"" # phone # "\"}";

    let headers : [Outcall.Header] = [
      { name = "x-rapidapi-key"; value = FAST2SMS_KEY },
      { name = "x-rapidapi-host"; value = "fast2sms.p.rapidapi.com" },
      { name = "Content-Type"; value = "application/json" },
    ];

    try {
      let _response = await Outcall.httpPostRequest(
        "https://fast2sms.p.rapidapi.com/v1/transactional-sms/transactional-api",
        headers,
        jsonBody,
        transform,
      );
      { ok = true; message = "OTP bheja gaya " # phone # " par" };
    } catch (_e) {
      { ok = false; message = "SMS bhejne mein error aaya. Dobara try karo." };
    };
  };

  public shared func verifyOtp(phone : Text, code : Text) : async OtpResult {
    switch (otpStore.get(phone)) {
      case (null) {
        { ok = false; message = "Pehle OTP bhejo" };
      };
      case (?(storedCode, timestamp)) {
        let now = Time.now();
        let elapsed = now - timestamp;
        if (elapsed > OTP_EXPIRY_NANOS) {
          ignore otpStore.remove(phone);
          { ok = false; message = "OTP ki meyad khatam ho gayi. Dobara OTP bhejo." };
        } else if (code == storedCode) {
          ignore otpStore.remove(phone);
          { ok = true; message = "OTP verified! Login ho gaya." };
        } else {
          { ok = false; message = "Galat OTP hai, dobara try karo" };
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };
};
