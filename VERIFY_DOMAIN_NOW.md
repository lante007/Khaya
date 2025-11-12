# 🚀 Verify Domain in MailerSend (15 minutes)

## ⚠️ **Current Blocker**

MailerSend requires domain verification before sending emails. This is a **one-time setup** that takes 15-30 minutes.

---

## ✅ **Step-by-Step Guide**

### **Step 1: Add Domain (2 minutes)**

1. Go to [MailerSend Domains](https://app.mailersend.com/domains)
2. Click **"Add Domain"** button
3. Enter: `projectkhaya.co.za`
4. Click **"Add Domain"**

---

### **Step 2: Get DNS Records (1 minute)**

MailerSend will show you DNS records. They look like this:

```
📋 VERIFICATION RECORD:
Type: TXT
Name: @ (or leave blank)
Value: ms-domain-verification=abc123xyz...

📋 DKIM RECORD 1:
Type: CNAME
Name: ms1._domainkey
Value: ms1.projectkhaya.co.za.mailersend.net

📋 DKIM RECORD 2:
Type: CNAME
Name: ms2._domainkey
Value: ms2.projectkhaya.co.za.mailersend.net

📋 SPF RECORD:
Type: TXT
Name: @
Value: v=spf1 include:spf.mailersend.net ~all

📋 DMARC RECORD:
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

**Copy these records** - you'll need them in the next step.

---

### **Step 3: Add DNS Records (5 minutes)**

#### **Where is projectkhaya.co.za registered?**

Common registrars:
- **Namecheap**: Dashboard → Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → Domains → DNS → Manage Zones
- **Cloudflare**: Dashboard → DNS → Records
- **Google Domains**: My Domains → DNS
- **Other**: Look for "DNS Settings" or "DNS Management"

#### **Add Each Record:**

For each record MailerSend gave you:

1. Click **"Add Record"** or **"Add New Record"**
2. Select the **Type** (TXT or CNAME)
3. Enter the **Name** (@ or ms1._domainkey, etc.)
4. Enter the **Value** (copy from MailerSend)
5. Set **TTL** to 3600 (or leave default)
6. Click **"Save"** or **"Add Record"**

**Repeat for all 5 records.**

---

### **Step 4: Wait for Propagation (5-15 minutes)**

DNS changes take time to propagate. Usually 5-15 minutes, sometimes up to 30 minutes.

#### **Check DNS Propagation:**

```bash
# Check TXT record
dig TXT projectkhaya.co.za

# Check DKIM
dig CNAME ms1._domainkey.projectkhaya.co.za

# Check DMARC
dig TXT _dmarc.projectkhaya.co.za
```

Or use online tool: https://dnschecker.org/

---

### **Step 5: Verify in MailerSend (1 minute)**

1. Go back to [MailerSend Domains](https://app.mailersend.com/domains)
2. Find `projectkhaya.co.za`
3. Click **"Verify Domain"** button
4. ✅ Should show "Verified"!

---

## 🎯 **After Verification**

Once verified, we can:
1. ✅ Send emails from `noreply@projectkhaya.co.za`
2. ✅ Send to ANY email address (not just yours)
3. ✅ Test the full auth flow
4. ✅ **LAUNCH!** 🚀

---

## 🆘 **Need Help?**

### **Don't have DNS access?**
- Contact whoever manages projectkhaya.co.za
- Or use a subdomain you control
- Or use a different domain temporarily

### **DNS not propagating?**
- Wait 30 minutes
- Check you entered records correctly
- Use dnschecker.org to verify
- Contact your registrar support

### **Still stuck?**
- Share screenshots of MailerSend DNS records
- Share screenshots of your DNS settings
- I'll help troubleshoot!

---

## ⏱️ **Timeline**

```
Now:        Add domain in MailerSend (2 min)
+2 min:     Copy DNS records (1 min)
+3 min:     Add DNS records (5 min)
+8 min:     Wait for propagation (5-15 min)
+23 min:    Verify domain (1 min)
+24 min:    ✅ READY TO LAUNCH!
```

---

## 🚀 **Let's Do This!**

**Start here**: https://app.mailersend.com/domains

**Questions?** Let me know and I'll help! 💪
