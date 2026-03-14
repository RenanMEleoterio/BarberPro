using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using BarbeariaSaaS.Services;
using System.Security.Claims;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
        {
            _dashboardService = dashboardService;
            _logger = logger;
        }

        [HttpGet("client/{id}")]
        public async Task<ActionResult> GetClientDashboard(int id)
        {
            try
            {
                var response = await _dashboardService.GetClientDashboardAsync(id);
                if (response == null) return NotFound();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no dashboard do cliente {Id}", id);
                return StatusCode(500, "Ocorreu um erro interno");
            }
        }

        [HttpGet("barber/{id}")]
        public async Task<ActionResult> GetBarberDashboard(int id)
        {
            try
            {
                var response = await _dashboardService.GetBarberDashboardAsync(id);
                if (response == null) return NotFound();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no dashboard do barbeiro {Id}", id);
                return StatusCode(500, "Ocorreu um erro interno");
            }
        }

        [HttpGet("manager/{barbeariaId}")]
        public async Task<ActionResult> GetManagerDashboard(int barbeariaId)
        {
            try
            {
                var response = await _dashboardService.GetManagerDashboardAsync(barbeariaId);
                if (response == null) return NotFound();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no dashboard do gerente da barbearia {Id}", barbeariaId);
                return StatusCode(500, "Ocorreu um erro interno");
            }
        }

        [HttpGet("manager/{barbeariaId}/barbers")]
        public async Task<ActionResult> GetManagerBarbers(int barbeariaId)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                if (userId == null) return Unauthorized();

                var response = await _dashboardService.GetManagerBarbersAsync(barbeariaId, userId.Value);
                if (response == null) return NotFound();
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar barbeiros do gerente da barbearia {Id}", barbeariaId);
                return StatusCode(500, "Ocorreu um erro interno");
            }
        }

        private int? GetUserIdFromClaims()
        {
            var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("NameId")?.Value
                ?? User.FindFirst("UserId")?.Value;
            if (int.TryParse(id, out var userId)) return userId;
            return null;
        }
    }
}




