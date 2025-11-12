# 🚨 URGENT: Rotate MailerSend API Key

**Date**: 2024-11-12  
**Status**: ACTION REQUIRED IMMEDIATELY

---

## ⚠️ **WHAT HAPPENED**

Your MailerSend API key was accidentally exposed on GitHub.

**MailerSend has detected this and sent you a warning email.**

---

## 🚨 **DO THIS RIGHT NOW** (5 minutes)

### **Step 1: Revoke Old Key**
1. Go to https://app.mailersend.com/
2. Click **Settings** → **API Tokens**
3. Find the exposed key
4. Click **Delete** or **Revoke**

### **Step 2: Generate New Key**
1. Click **Generate New Token**
2. Name it: "Khaya Production - 2024-11-12"
3. Select scope: **Email** (Full access)
4. Click **Generate**
5. **Copy the new key immediately**

### **Step 3: Update Environment Variables**

**Backend:**
```bash
cd /workspaces/Khaya/backend
nano .env
```
Replace the `MAILERSEND_API_KEY` value with your new key.

**Root:**
```bash
cd /workspaces/Khaya
nano .env
```
Replace the `MAILERSEND_API_KEY` value with your new key.

### **Step 4: Test New Key**
```bash
cd /workspaces/Khaya/backend
npx tsx test-mailersend-simple.ts lante007@gmail.com
```

You should see: `✅ Success!`

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Old API key revoked in MailerSend
- [ ] New API key generated
- [ ] backend/.env updated with new key
- [ ] root .env updated with new key
- [ ] Email test successful
- [ ] MailerSend account unpaused (if paused)

---

## 🛡️ **PREVENTION**

### **What I've Done:**
- ✅ Removed all files with exposed keys
- ✅ Added .env to .gitignore
- ✅ Pushed fixes to GitHub

### **What You Should Do:**
- ✅ Never share API keys in chat/email
- ✅ Always use environment variables
- ✅ Check commits before pushing
- ✅ Enable GitHub secret scanning

---

## 📞 **IF YOUR ACCOUNT IS PAUSED**

Contact MailerSend support:
- Email: support@mailersend.com
- Dashboard: https://app.mailersend.com/
- Explain: "I've rotated the exposed key and secured my repository"

---

## 🎯 **CURRENT STATUS**

```
Old Key:            REVOKED (you must do this)
New Key:            GENERATED (you must do this)
Environment Files:  UPDATED (you must do this)
Testing:            VERIFIED (you must do this)
GitHub:             CLEANED ✅
```

---

## ⏰ **TIMELINE**

- **Now**: Revoke old key (2 min)
- **+2 min**: Generate new key (1 min)
- **+3 min**: Update .env files (2 min)
- **+5 min**: Test email sending (1 min)
- **+6 min**: ✅ SECURE AGAIN!

---

**DO THIS NOW!** Your MailerSend account may be paused until you rotate the key! 🚨

**Reply "done" when you've rotated the key and I'll help you test it!** 💪
