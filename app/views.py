from django.shortcuts import render, redirect
from django.core import signing
from django.http import JsonResponse
from base64 import urlsafe_b64encode, urlsafe_b64decode
from django.views.decorators.cache import never_cache

def index(request):
    return render(request, 'index.html')

def qrcode_time_limited(request):
    return render(request, 'qrcode-time-limited.html')

@never_cache
def generate_temp_link(request):
    url = request.GET.get('url', '').strip()
    if not url:
        return JsonResponse({'error': 'URL is required'}, status=400)
    
    # Sign the URL using TimestampSigner
    signer = signing.TimestampSigner()
    token = signer.sign(url)
    
    # Base64 encode the token to make it completely URL-safe (no slashes, colons, etc.)
    safe_token = urlsafe_b64encode(token.encode('utf-8')).decode('utf-8')
    
    # Build the full redirect URL pointing to our backend redirect endpoint
    redirect_path = f"/r/{safe_token}/"
    full_url = request.build_absolute_uri(redirect_path)
    
    return JsonResponse({'redirect_url': full_url})

def redirect_temp_link(request, token):
    try:
        # Decode the URL-safe base64 token
        decoded_token = urlsafe_b64decode(token.encode('utf-8')).decode('utf-8')
        signer = signing.TimestampSigner()
        # Expire after 60 seconds (max_age is in seconds)
        original_url = signer.unsign(decoded_token, max_age=60)
        return redirect(original_url)
    except signing.SignatureExpired:
        return render(request, 'expired.html', {'reason': 'expired'}, status=410)
    except Exception:
        return render(request, 'expired.html', {'reason': 'invalid'}, status=400)