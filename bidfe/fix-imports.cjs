const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    const newContent = content.split(from).join(to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

// RootStore
replaceInFile('src/app/stores/RootStore.ts', [
  ['../../features/auth/model/auth.store', '../../entities/user/model/auth.store'],
  ['../../features/item/model/item.store', '../../entities/item/model/item.store'],
  ['../../features/auction/model/auction.store', '../../entities/auction/model/auction.store']
]);

// entities/item
replaceInFile('src/entities/item/model/item.store.ts', [
  ['../../auth/types', '../../user/types'],
  ['../../auction/types.ts', '../../auction/types']
]);
replaceInFile('src/entities/item/types.ts', [
  ['../auth/types', '../user/types']
]);

// entities/user
replaceInFile('src/entities/user/model/auth.store.ts', [
  ['../../profile/api/profile.api', '../../../features/profile/api/profile.api']
]);

// features/manage-auction
replaceInFile('src/features/manage-auction/ui/CreateAuctionModal.tsx', [
  ['../types', '../../../entities/auction/types'],
  ['../../item/types', '../../../entities/item/types']
]);

// features/place-bid
replaceInFile('src/features/place-bid/ui/BiddingCard.tsx', [
  ['../types', '../../../entities/auction/types']
]);
replaceInFile('src/features/place-bid/ui/BidHistory.tsx', [
  ['../types', '../../../entities/auction/types']
]);

// features/profile
replaceInFile('src/features/profile/api/profile.api.ts', [
  ['../../item/types', '../../../entities/item/types'],
  ['../../auth/types', '../../../entities/user/types']
]);
replaceInFile('src/features/profile/hooks/useUserListings.ts', [
  ['../../item/types', '../../../entities/item/types']
]);
replaceInFile('src/features/profile/model/profile.store.ts', [
  ['../../auth/types', '../../../entities/user/types']
]);

// features/submit-item
replaceInFile('src/features/submit-item/ui/ImageUploader.tsx', [
  ['../types', '../../../entities/item/types']
]);
replaceInFile('src/features/submit-item/ui/SubmitItemForm.tsx', [
  ['../types', '../../../entities/item/types']
]);
// Wait, steps are inside submit-item/ui/steps/
const steps = ['StepCondition.tsx', 'StepIdentity.tsx', 'StepPhotos.tsx', 'StepPricing.tsx', 'StepSpecs.tsx'];
for (const step of steps) {
  replaceInFile(`src/features/submit-item/ui/steps/${step}`, [
    ['../../types', '../../../../entities/item/types']
  ]);
}

// pages
replaceInFile('src/pages/AuctionDetailsPage.tsx', [
  ['../features/auction/ui/BiddingCard.tsx', '../features/place-bid/ui/BiddingCard'],
  ['../features/auction/ui/BidHistory.tsx', '../features/place-bid/ui/BidHistory'],
  ['../features/item/types.ts', '../entities/item/types']
]);
replaceInFile('src/pages/AuctionListTemplate.tsx', [
  ['../features/auction/ui/AuctionCard.tsx', '../entities/auction/ui/AuctionCard']
]);
replaceInFile('src/pages/ItemDetailsPage.tsx', [
  ['../features/auction/ui/CreateAuctionModal.tsx', '../features/manage-auction/ui/CreateAuctionModal'],
  ['../features/item/ui/EditItemModal.tsx', '../features/submit-item/ui/EditItemModal'],
  ['../features/auction/types.ts', '../entities/auction/types'],
  ['../features/item/types.ts', '../entities/item/types']
]);
replaceInFile('src/pages/LoginPage.tsx', [
  ['../features/auth/ui/LoginForm', '../features/auth-form/ui/LoginForm'],
  ['../features/auth/ui/RegisterForm', '../features/auth-form/ui/RegisterForm']
]);
replaceInFile('src/pages/ProfilePage.tsx', [
  ['../features/item/ui/ItemCard.tsx', '../entities/item/ui/ItemCard']
]);
replaceInFile('src/pages/SubmitItemPage.tsx', [
  ['../features/item/ui/SubmitItemForm', '../features/submit-item/ui/SubmitItemForm'],
  ['../features/item/types', '../entities/item/types']
]);

// shared
replaceInFile('src/shared/ui/details/index.tsx', [
  ['../../../features/item/types', '../../../entities/item/types']
]);

console.log('Imports replaced.');
