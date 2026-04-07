using System.Security.Claims;

namespace BarbeariaSaaS.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int? TryGetUserId(this ClaimsPrincipal user)
        {
            var claimValue = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("nameid")?.Value
                ?? user.FindFirst("NameId")?.Value
                ?? user.FindFirst("UserId")?.Value;

            return int.TryParse(claimValue, out var userId) ? userId : null;
        }

        public static int GetUserIdOrDefault(this ClaimsPrincipal user)
        {
            return user.TryGetUserId() ?? 0;
        }

        public static int? GetBarbeariaId(this ClaimsPrincipal user)
        {
            var claimValue = user.FindFirst("BarbeariaId")?.Value;
            return int.TryParse(claimValue, out var barbeariaId) ? barbeariaId : null;
        }

        public static string GetTipoUsuario(this ClaimsPrincipal user)
        {
            return user.FindFirst("TipoUsuario")?.Value ?? string.Empty;
        }
    }
}
