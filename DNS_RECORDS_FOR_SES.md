# 📧 DNS Records for AWS SES - projectkhaya.co.za

## 🎯 Add These DNS Records to Your Domain

Go to your DNS provider (where you manage projectkhaya.co.za) and add these records:

---

## 1️⃣ Domain Verification Record (TXT)

**Purpose:** Verifies you own the domain

| Type | Name | Value |
|------|------|-------|
| TXT | `_amazonses.projectkhaya.co.za` | `Z+8dtOUTB5Nv3EWlnGfr3DKxA4jzTnp0KqPCuUqU5Z4=` |

**Or if your DNS provider requires:**
| Type | Host | Value |
|------|------|-------|
| TXT | `_amazonses` | `Z+8dtOUTB5Nv3EWlnGfr3DKxA4jzTnp0KqPCuUqU5Z4=` |

---

## 2️⃣ DKIM Records (CNAME) - For Email Authentication

**Purpose:** Prevents emails from going to spam

### DKIM Record 1:
| Type | Name | Value |
|------|------|-------|
| CNAME | `pw7wrgef4blqbrcrsh5mgu3e56tddutw._domainkey.projectkhaya.co.za` | `pw7wrgef4blqbrcrsh5mgu3e56tddutw.dkim.amazonses.com` |

**Or:**
| Type | Host | Value |
|------|------|-------|
| CNAME | `pw7wrgef4blqbrcrsh5mgu3e56tddutw._domainkey` | `pw7wrgef4blqbrcrsh5mgu3e56tddutw.dkim.amazonses.com` |

---

### DKIM Record 2:
| Type | Name | Value |
|------|------|-------|
| CNAME | `5djxkkxppdzfz7zvikqx4md5ev5aowjo._domainkey.projectkhaya.co.za` | `5djxkkxppdzfz7zvikqx4md5ev5aowjo.dkim.amazonses.com` |

**Or:**
| Type | Host | Value |
|------|------|-------|
| CNAME | `5djxkkxppdzfz7zvikqx4md5ev5aowjo._domainkey` | `5djxkkxppdzfz7zvikqx4md5ev5aowjo.dkim.amazonses.com` |

---

### DKIM Record 3:
| Type | Name | Value |
|------|------|-------|
| CNAME | `bonq5stoh6cqkvjlgo37ma5ee6p6blxs._domainkey.projectkhaya.co.za` | `bonq5stoh6cqkvjlgo37ma5ee6p6blxs.dkim.amazonses.com` |

**Or:**
| Type | Host | Value |
|------|------|-------|
| CNAME | `bonq5stoh6cqkvjlgo37ma5ee6p6blxs._domainkey` | `bonq5stoh6cqkvjlgo37ma5ee6p6blxs.dkim.amazonses.com` |

---

## 📋 Summary - 4 Records Total

1. **1 TXT record** - Domain verification
2. **3 CNAME records** - DKIM authentication

---

## 🔧 Where to Add These Records

### Common DNS Providers:

#### Cloudflare:
1. Go to: https://dash.cloudflare.com/
2. Select: projectkhaya.co.za
3. Click: **DNS** → **Records**
4. Click: **Add record**
5. Add each record above

#### GoDaddy:
1. Go to: https://dcc.godaddy.com/
2. Select: projectkhaya.co.za
3. Click: **DNS** → **Manage DNS**
4. Click: **Add** for each record

#### Namecheap:
1. Go to: https://ap.www.namecheap.com/
2. Select: projectkhaya.co.za
3. Click: **Advanced DNS**
4. Click: **Add New Record**

#### AWS Route 53:
1. Go to: https://console.aws.amazon.com/route53/
2. Select: projectkhaya.co.za hosted zone
3. Click: **Create record**
4. Add each record

---

## ✅ Verification

### Check DNS Propagation (After Adding):
```bash
# Check TXT record
dig TXT _amazonses.projectkhaya.co.za +short

# Check DKIM records
dig CNAME pw7wrgef4blqbrcrsh5mgu3e56tddutw._domainkey.projectkhaya.co.za +short
dig CNAME 5djxkkxppdzfz7zvikqx4md5ev5aowjo._domainkey.projectkhaya.co.za +short
dig CNAME bonq5stoh6cqkvjlgo37ma5ee6p6blxs._domainkey.projectkhaya.co.za +short
```

### Check AWS SES Status:
```bash
# Check domain verification status
aws ses get-identity-verification-attributes \
  --identities projectkhaya.co.za \
  --region us-east-1

# Check DKIM status
aws ses get-identity-dkim-attributes \
  --identities projectkhaya.co.za \
  --region us-east-1
```

---

## ⏱️ How Long Does It Take?

- **DNS Propagation:** 5 minutes to 48 hours (usually 15-30 minutes)
- **AWS Verification:** Automatic once DNS propagates

---

## 🎯 After Verification

Once verified, you can send from:
- ✅ Amanda@projectkhaya.co.za
- ✅ noreply@projectkhaya.co.za
- ✅ support@projectkhaya.co.za
- ✅ ANY email @projectkhaya.co.za

No need to verify individual email addresses! 🎉

---

## 📧 Test After Verification

```bash
# Test OTP sending
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/auth.requestOTP \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should work and send email!
```

---

## 🔍 Troubleshooting

### Issue: DNS records not propagating
**Wait:** 15-30 minutes, then check again

### Issue: Still showing "Pending"
**Check:** DNS records are correct (no typos)
**Verify:** Using correct DNS provider

### Issue: DKIM not verifying
**Check:** All 3 CNAME records are added
**Verify:** Values end with `.dkim.amazonses.com`

---

## 📋 Quick Copy-Paste Format

### For DNS Provider:

**TXT Record:**
```
Name: _amazonses.projectkhaya.co.za
Value: Z+8dtOUTB5Nv3EWlnGfr3DKxA4jzTnp0KqPCuUqU5Z4=
```

**CNAME Record 1:**
```
Name: pw7wrgef4blqbrcrsh5mgu3e56tddutw._domainkey.projectkhaya.co.za
Value: pw7wrgef4blqbrcrsh5mgu3e56tddutw.dkim.amazonses.com
```

**CNAME Record 2:**
```
Name: 5djxkkxppdzfz7zvikqx4md5ev5aowjo._domainkey.projectkhaya.co.za
Value: 5djxkkxppdzfz7zvikqx4md5ev5aowjo.dkim.amazonses.com
```

**CNAME Record 3:**
```
Name: bonq5stoh6cqkvjlgo37ma5ee6p6blxs._domainkey.projectkhaya.co.za
Value: bonq5stoh6cqkvjlgo37ma5ee6p6blxs.dkim.amazonses.com
```

---

## ✅ Checklist

- [ ] Add TXT record for domain verification
- [ ] Add CNAME record 1 (DKIM)
- [ ] Add CNAME record 2 (DKIM)
- [ ] Add CNAME record 3 (DKIM)
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Check verification status
- [ ] Test OTP email sending

---

**Add these 4 DNS records to your domain provider, then wait 15-30 minutes for verification!** 🚀

**Once verified, OTP emails will work from any @projectkhaya.co.za address!** ✅
