# AdEarn - Telegram Mini App 📱💰

AdEarn হলো একটি আধুনিক ও রেসপনসিভ **Telegram Mini App**, যার মাধ্যমে ব্যবহারকারীরা বিভিন্ন টাস্ক (ভিডিও বিজ্ঞাপন দেখা, স্পন্সর পোস্ট ভিজিট, ছোট সার্ভে সম্পন্ন করা) করে কয়েন ও নগদ টাকা (৳) উপার্জন করতে পারে। উপার্জিত টাকা সরাসরি **বিকাশ (bKash)** এবং **নগদ (Nagad)**-এর মাধ্যমে উইথড্র করা যায়।

সব ডাটা রিয়েলটাইমে **Firebase Firestore**-এ সংরক্ষিত এবং সুরক্ষিত।

---

## ⚠️ GitHub Pages-এ হোয়াইট স্ক্রিন (White Screen) সমাধানের উপায়

GitHub Pages-এ সাব-ফোল্ডার URL (যেমন: `username.github.io/repo-name/`) ব্যবহার করার কারণে Vite-এর এসেট পাথ ঠিক রাখা অত্যন্ত জরুরি।

### আমরা যা ফিক্স করেছি:
1. **`vite.config.ts` ফাইলে `base: './'` যুক্ত করা হয়েছে**:
   আগে এসেট পাথগুলো `/assets/...` হিসেবে লোড হতো, যা গিটহাব পেইজে ৪MD Not Found দিত। এখন `./assets/...` হওয়ায় যেকোনো ফোল্ডার বা সাব-পাথে নিখুঁতভাবে চলবে।
2. **Error Boundary ও অটো-টাইমআউট**:
   কোনো কারণে ফায়ারবেস বা নেটওয়ার্ক স্লো থাকলে যাতে সাদা পর্দা না আসে, তার জন্য অটোমেটিক ফলব্যাক প্রোফাইল এবং এরর হ্যান্ডলার যুক্ত করা হয়েছে।
3. **অটোমেটিক গিটহাব অ্যাকশন ওয়ার্কফ্লো (`.github/workflows/deploy.yml`)**:
   গিটহাবে পুশ করলেই স্বয়ংক্রিয়ভাবে বিল্ড হয়ে গিটহাব পেইজে লাইভ হয়ে যাবে।

---

## 🛠️ ফায়ারবেস ডোমেইন অথোরাইজেশন (Firebase Authorized Domain)
গিটহাব পেইজে লগইন সঠিকভাবে কাজ করতে:
1. আপনার [Firebase Console](https://console.firebase.google.com)-এ যান।
2. **Authentication** > **Settings** > **Authorized domains**-এ যান।
3. **Add domain** বাটনে ক্লিক করে আপনার গিটহাব ডোমেনটি যোগ করুন (যেমন: `yourusername.github.io`)।

---

## 🚀 গিটহাবে আপডেট পুশ করার নিয়ম (Push Fix to GitHub)

```bash
# ১. আপডেট করা কোড স্টেজ করুন
git add .

# ২. কমিট করুন
git commit -m "fix: resolve white screen on github pages with relative base path"

# ৩. মেইন ব্রাঞ্চে পুশ করুন
git push origin main
```

### GitHub Repository সেটিংস থেকে GitHub Pages চালু করার নিয়ম:
1. আপনার GitHub Repository-তে যান।
2. **Settings** ট্যাবে ক্লিক করুন।
3. বাঁ পাশের মেনু থেকে **Pages**-এ যান।
4. **Build and deployment** সেকশনে:
   - **Source**: `GitHub Actions` সিলেক্ট করুন (এটি স্বয়ংক্রিয়ভাবে `.github/workflows/deploy.yml` দিয়ে বিল্ড ও ডিপ্লয় করবে)।
   - অথবা যদি ব্র্যাঞ্চ দিয়ে করতে চান, তবে `npm run build` দিয়ে তৈরি হওয়া `dist` ফোল্ডারের ফাইলগুলো `gh-pages` ব্রাঞ্চে ডিপ্লয় করুন।

---

## 📲 টেলিগ্রাম বটে মিনি অ্যাপ যুক্ত করার নিয়ম (Telegram BotFather Setup)

১. টেলিগ্রামে [@BotFather](https://t.me/BotFather)-এ যান।
২. `/newapp` কমান্ড পাঠিয়ে আপনার তৈরি করা বটটি সিলেক্ট করুন।
৩. টাইটেল ও ডেসক্রিপশন দিন (`AdEarn Mini App`)।
৪. ব্যানার ফটো আপলোড করুন।
৫. আপনার GitHub Pages URL দিন (যেমন: `https://yourusername.github.io/repository-name/`)।
৬. শর্ট নেম দিন (যেমন: `app`)।
৭. আপনি লিংক পাবেন: `t.me/YOUR_BOT/app`। এই লিংকে ক্লিক করলেই টেলিগ্রামের ভেতরে সরাসরি মিনি অ্যাপটি চালু হবে!

---

## 💻 লোকাল ডেভেলপমেন্ট কমান্ডসমূহ

```bash
# ডিপেন্ডেন্সি ইনস্টল
npm install

# ডেভেলপমেন্ট সার্ভার চালু
npm run dev

# প্রোডাকশন বিল্ড
npm run build
```
