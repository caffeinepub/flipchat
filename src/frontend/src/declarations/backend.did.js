/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const _CaffeineStorageCreateCertificateResult = IDL.Record({
  'method' : IDL.Text,
  'blob_hash' : IDL.Text,
});
export const _CaffeineStorageRefillInformation = IDL.Record({
  'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
});
export const _CaffeineStorageRefillResult = IDL.Record({
  'success' : IDL.Opt(IDL.Bool),
  'topped_up_amount' : IDL.Opt(IDL.Nat),
});
export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const ExternalBlob = IDL.Vec(IDL.Nat8);
export const UserProfile = IDL.Record({
  'name' : IDL.Text,
  'email' : IDL.Text,
  'profilePicture' : IDL.Opt(ExternalBlob),
});
export const OtpResult = IDL.Record({
  'ok' : IDL.Bool,
  'message' : IDL.Text,
});

export const idlService = IDL.Service({
  '_caffeineStorageBlobIsLive' : IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Bool],
      ['query'],
    ),
  '_caffeineStorageBlobsToDelete' : IDL.Func(
      [],
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      ['query'],
    ),
  '_caffeineStorageConfirmBlobDeletion' : IDL.Func(
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      [],
      [],
    ),
  '_caffeineStorageCreateCertificate' : IDL.Func(
      [IDL.Text],
      [_CaffeineStorageCreateCertificateResult],
      [],
    ),
  '_caffeineStorageRefillCashier' : IDL.Func(
      [IDL.Opt(_CaffeineStorageRefillInformation)],
      [_CaffeineStorageRefillResult],
      [],
    ),
  '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getUserProfile' : IDL.Func(
      [IDL.Principal],
      [IDL.Opt(UserProfile)],
      ['query'],
    ),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'sendOtp' : IDL.Func([IDL.Text], [OtpResult], []),
  'verifyOtp' : IDL.Func([IDL.Text, IDL.Text], [OtpResult], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const _CaffeineStorageCreateCertificateResult = IDL.Record({
    'method' : IDL.Text,
    'blob_hash' : IDL.Text,
  });
  const _CaffeineStorageRefillInformation = IDL.Record({
    'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
  });
  const _CaffeineStorageRefillResult = IDL.Record({
    'success' : IDL.Opt(IDL.Bool),
    'topped_up_amount' : IDL.Opt(IDL.Nat),
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const ExternalBlob = IDL.Vec(IDL.Nat8);
  const UserProfile = IDL.Record({
    'name' : IDL.Text,
    'email' : IDL.Text,
    'profilePicture' : IDL.Opt(ExternalBlob),
  });
  const OtpResult = IDL.Record({
    'ok' : IDL.Bool,
    'message' : IDL.Text,
  });
  
  return IDL.Service({
    '_caffeineStorageBlobIsLive' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Bool],
        ['query'],
      ),
    '_caffeineStorageBlobsToDelete' : IDL.Func(
        [],
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        ['query'],
      ),
    '_caffeineStorageConfirmBlobDeletion' : IDL.Func(
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    '_caffeineStorageCreateCertificate' : IDL.Func(
        [IDL.Text],
        [_CaffeineStorageCreateCertificateResult],
        [],
      ),
    '_caffeineStorageRefillCashier' : IDL.Func(
        [IDL.Opt(_CaffeineStorageRefillInformation)],
        [_CaffeineStorageRefillResult],
        [],
      ),
    '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'sendOtp' : IDL.Func([IDL.Text], [OtpResult], []),
    'verifyOtp' : IDL.Func([IDL.Text, IDL.Text], [OtpResult], []),
  });
};

export const init = ({ IDL }) => { return []; };
