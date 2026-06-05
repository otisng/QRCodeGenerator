from django.shortcuts import render, redirect
from django.core import signing
from django.http import JsonResponse

def index(request):
    return render(request, 'index.html')

def qrcode_time_limited(request):
    return render(request, 'qrcode-time-limited.html')

def generate_temp_link(request):
    url = request.GET.get('url', '').strip()
    if not url:
        return JsonResponse({'error': 'URL is required'}, status=400)
    
    # Sign the URL using TimestampSigner
    signer = signing.TimestampSigner()
    token = signer.sign(url)
    
    # Build the full redirect URL pointing to our backend redirect endpoint
    redirect_path = f"/r/{token}/"
    full_url = request.build_absolute_uri(redirect_path)
    
    return JsonResponse({'redirect_url': full_url})

def redirect_temp_link(request, token):
    signer = signing.TimestampSigner()
    try:
        # Expire after 60 seconds (max_age is in seconds)
        original_url = signer.unsign(token, max_age=60)
        return redirect(original_url)
    except signing.SignatureExpired:
        return render(request, 'expired.html', {'reason': 'expired'}, status=410)
    except signing.BadSignature:
        return render(request, 'expired.html', {'reason': 'invalid'}, status=400)