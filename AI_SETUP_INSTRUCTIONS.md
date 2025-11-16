# AI API Setup Instructions

**Date:** November 12, 2025  
**Status:** Ready to configure

---

## 🎯 Overview

We're adding AI features to Khaya using:
- **OpenAI (ChatGPT)** - Already installed ✅
- **Anthropic (Claude)** - Need to install

---

## 📋 Step 1: Get API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "Khaya Production"
4. Copy the key (starts with `sk-proj-...`)
5. Save it securely

**Estimated Cost:** ~$70/month for our usage

### Anthropic (Claude) API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Create Key"
5. Name it "Khaya Production"
6. Copy the key (starts with `sk-ant-...`)
7. Save it securely

**Estimated Cost:** ~$300/month for our usage

---

## 📋 Step 2: Install Anthropic SDK

```bash
cd /workspaces/Khaya
pnpm add @anthropic-ai/sdk
```

---

## 📋 Step 3: Add Environment Variables

### Local Development (.env)
Add these to `/workspaces/Khaya/.env`:

```bash
# AI API Keys
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# AI Configuration
AI_MODEL_OPENAI=gpt-4o-mini
AI_MODEL_CLAUDE=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### Production (.env.production)
Add the same variables to `/workspaces/Khaya/.env.production`

### AWS Lambda Environment Variables
After getting the keys, update Lambda:

```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --environment "Variables={
    JWT_SECRET=$JWT_SECRET,
    MAILERSEND_API_KEY=$MAILERSEND_API_KEY,
    DYNAMODB_TABLE=khaya-prod,
    S3_BUCKET=khaya-uploads-615608124862,
    AWS_REGION=us-east-1,
    OPENAI_API_KEY=your-openai-key-here,
    ANTHROPIC_API_KEY=your-anthropic-key-here,
    AI_MODEL_OPENAI=gpt-4o-mini,
    AI_MODEL_CLAUDE=claude-3-5-sonnet-20241022
  }" \
  --region us-east-1
```

---

## 📋 Step 4: Test API Keys

### Test OpenAI
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

**Expected:** List of available models

### Test Anthropic
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected:** Response from Claude

---

## 📋 Step 5: Verify Installation

After adding the keys, run:

```bash
# Check if Anthropic SDK is installed
pnpm list @anthropic-ai/sdk

# Check if OpenAI SDK is installed
pnpm list openai

# Check environment variables
echo $OPENAI_API_KEY | cut -c1-10
echo $ANTHROPIC_API_KEY | cut -c1-10
```

---

## 🎯 What's Next

Once the API keys are configured, we'll implement:

### Week 1 Features (This Week)
1. **AI Job Enhancement** (1 day)
   - "Enhance with AI" button on job posting
   - Uses Claude API
   - Improves job descriptions

2. **AI Bid Assistant** (1 day)
   - "Generate Proposal" button on bid form
   - Uses Claude API
   - Helps workers write winning bids

3. **Trust Badges** (1 day)
   - Verified, Top-Rated, Fast Response badges
   - No AI needed
   - Visual credibility

4. **Review Prompts** (1 day)
   - Auto-prompt after job completion
   - No AI needed
   - Builds trust

5. **Smart Search** (2 days)
   - Natural language search
   - Uses ChatGPT API
   - Better job discovery

---

## 💰 Cost Breakdown

### Monthly AI Costs
| Service | Usage | Cost |
|---------|-------|------|
| **Claude API** | 1M tokens/month | ~$300 |
| - Job enhancement | 300K tokens | $90 |
| - Bid proposals | 300K tokens | $90 |
| - Chat assistant | 400K tokens | $120 |
| **OpenAI API** | 500K tokens/month | ~$70 |
| - Smart search | 200K tokens | $30 |
| - Material recommendations | 300K tokens | $40 |
| **Total** | | **~$370/month** |

### ROI Calculation
- **Cost:** $370/month
- **Expected Revenue:** $5,000/month (200 hires @ R500 commission)
- **ROI:** 13.5x
- **Payback:** Immediate

### Cost Optimization Tips
1. Use `gpt-4o-mini` instead of `gpt-4` (10x cheaper)
2. Use `claude-3-5-sonnet` instead of `claude-opus` (5x cheaper)
3. Cache common prompts
4. Limit max tokens to 2000
5. Implement rate limiting

---

## 🔒 Security Best Practices

### API Key Management
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys every 90 days
- ✅ Monitor usage for anomalies
- ✅ Set spending limits

### Usage Monitoring
```bash
# Check OpenAI usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer YOUR_KEY"

# Check Anthropic usage
# (Check dashboard at console.anthropic.com)
```

### Spending Limits
1. **OpenAI:** Set limit at $100/month
2. **Anthropic:** Set limit at $400/month
3. **Alerts:** Email when 80% reached

---

## 🚨 Troubleshooting

### Issue: "Invalid API Key"
**Solution:** 
- Check key is correct (no extra spaces)
- Verify key is active in dashboard
- Check key has correct permissions

### Issue: "Rate Limit Exceeded"
**Solution:**
- Implement exponential backoff
- Add request queuing
- Upgrade to higher tier

### Issue: "Insufficient Credits"
**Solution:**
- Add payment method
- Top up credits
- Check billing settings

---

## 📞 Support

### OpenAI Support
- **Dashboard:** https://platform.openai.com/
- **Docs:** https://platform.openai.com/docs
- **Status:** https://status.openai.com/

### Anthropic Support
- **Dashboard:** https://console.anthropic.com/
- **Docs:** https://docs.anthropic.com/
- **Email:** support@anthropic.com

---

## ✅ Checklist

Before proceeding to implementation:

- [ ] OpenAI account created
- [ ] OpenAI API key obtained
- [ ] Anthropic account created
- [ ] Anthropic API key obtained
- [ ] Anthropic SDK installed (`pnpm add @anthropic-ai/sdk`)
- [ ] Keys added to `.env`
- [ ] Keys added to `.env.production`
- [ ] Keys tested with curl
- [ ] Lambda environment variables updated
- [ ] Spending limits set
- [ ] Usage monitoring enabled

---

## 🎯 Ready to Implement!

Once all checkboxes are complete, we can start implementing the AI features!

**Next Step:** Implement AI Job Enhancement feature (1 day)

---

**Created:** November 12, 2025  
**Status:** Waiting for API keys
