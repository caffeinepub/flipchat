import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
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
  let otpStore = Map.empty<Text, (Text, Int)>();

  // Keep variable name for stable compatibility; now holds 2Factor.in API key
  var FAST2SMS_KEY : Text = "aa417444-2cad-11f1-ae4a-0200cd936042";
  let OTP_EXPIRY_NANOS : Int = 5 * 60 * 1_000_000_000;

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

    // 2Factor.in API - send specific OTP
    let url = "https://2factor.in/API/V1/" # FAST2SMS_KEY
      # "/SMS/" # phone
      # "/" # code
      # "/OTP1";

    let headers : [Outcall.Header] = [
      { name = "Cache-Control"; value = "no-cache" },
    ];
    try {
      let response = await Outcall.httpGetRequest(url, headers, transform);
      // 2Factor.in returns {"Status":"Success",...} on success
      if (response.contains(#text "\"Status\":\"Success\"")) {
        { ok = true; message = "OTP bheja gaya " # phone # " par" };
      } else {
        otpStore.remove(phone);
        { ok = false; message = "SMS nahi gaya: " # response };
      };
    } catch (_e) {
      otpStore.remove(phone);
      { ok = false; message = "Network error: SMS service se connect nahi ho paya. Dobara try karo." };
    };
  };

  public shared func verifyOtp(phone : Text, code : Text) : async OtpResult {
    switch (otpStore.get(phone)) {
      case (null) { { ok = false; message = "Pehle OTP bhejo" } };
      case (?(storedCode, timestamp)) {
        let now = Time.now();
        let elapsed = now - timestamp;
        if (elapsed > OTP_EXPIRY_NANOS) {
          otpStore.remove(phone);
          { ok = false; message = "OTP ki meyad khatam ho gayi. Dobara OTP bhejo." };
        } else if (code == storedCode) {
          otpStore.remove(phone);
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

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };
};
