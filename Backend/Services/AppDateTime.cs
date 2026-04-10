using System;
using System.Globalization;

namespace BarbeariaSaaS.Services
{
    public static class AppDateTime
    {
        private static readonly TimeSpan DefaultBrazilOffset = TimeSpan.FromHours(-3);
        private static readonly CultureInfo PtBrCulture = CultureInfo.GetCultureInfo("pt-BR");

        public static DateTime UtcNow()
        {
            return DateTime.UtcNow;
        }

        public static DateTime NormalizeClientDateTimeToUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            var unspecifiedValue = DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
            return new DateTimeOffset(unspecifiedValue, DefaultBrazilOffset).UtcDateTime;
        }

        public static DateTime MarkAsUtc(DateTime value)
        {
            return value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        public static DateTimeOffset ToBusinessDateTimeOffset(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return new DateTimeOffset(value, TimeSpan.Zero).ToOffset(DefaultBrazilOffset);
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return new DateTimeOffset(value.ToUniversalTime(), TimeSpan.Zero).ToOffset(DefaultBrazilOffset);
            }

            return new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Unspecified), DefaultBrazilOffset);
        }

        public static DateTime ToBusinessDateTime(DateTime value)
        {
            return DateTime.SpecifyKind(ToBusinessDateTimeOffset(value).DateTime, DateTimeKind.Unspecified);
        }

        public static DateTime TodayInBusinessTimeZone()
        {
            return GetBusinessDate(DateTime.UtcNow);
        }

        public static DateTime GetBusinessDate(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                var businessDate = new DateTimeOffset(value).ToOffset(DefaultBrazilOffset).Date;
                return DateTime.SpecifyKind(businessDate, DateTimeKind.Unspecified);
            }

            if (value.Kind == DateTimeKind.Local)
            {
                var businessDate = new DateTimeOffset(value.ToUniversalTime(), TimeSpan.Zero)
                    .ToOffset(DefaultBrazilOffset)
                    .Date;

                return DateTime.SpecifyKind(businessDate, DateTimeKind.Unspecified);
            }

            return DateTime.SpecifyKind(value.Date, DateTimeKind.Unspecified);
        }

        public static DateTime StartOfBusinessDayUtc(DateTime value)
        {
            return NormalizeClientDateTimeToUtc(GetBusinessDate(value));
        }

        public static DateTime EndOfBusinessDayUtcExclusive(DateTime value)
        {
            return NormalizeClientDateTimeToUtc(GetBusinessDate(value).AddDays(1));
        }

        public static DateTime CreateBusinessSlotUtc(DateTime date, TimeSpan time)
        {
            var businessDate = GetBusinessDate(date);
            var localSlot = DateTime.SpecifyKind(businessDate.Add(time), DateTimeKind.Unspecified);
            return NormalizeClientDateTimeToUtc(localSlot);
        }

        public static DateTime StartOfBusinessWeek(DateTime reference)
        {
            var businessDate = GetBusinessDate(reference);
            return DateTime.SpecifyKind(businessDate.AddDays(-(int)businessDate.DayOfWeek), DateTimeKind.Unspecified);
        }

        public static DateTime StartOfBusinessWeekUtc(DateTime reference)
        {
            return NormalizeClientDateTimeToUtc(StartOfBusinessWeek(reference));
        }

        public static DateTime StartOfBusinessMonth(DateTime reference)
        {
            var businessDate = GetBusinessDate(reference);
            return new DateTime(businessDate.Year, businessDate.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        }

        public static DateTime StartOfBusinessMonthUtc(DateTime reference)
        {
            return NormalizeClientDateTimeToUtc(StartOfBusinessMonth(reference));
        }

        public static DateTime StartOfBusinessQuarter(DateTime reference)
        {
            var businessDate = GetBusinessDate(reference);
            var quarter = (businessDate.Month - 1) / 3;
            return new DateTime(businessDate.Year, quarter * 3 + 1, 1, 0, 0, 0, DateTimeKind.Unspecified);
        }

        public static DateTime StartOfBusinessQuarterUtc(DateTime reference)
        {
            return NormalizeClientDateTimeToUtc(StartOfBusinessQuarter(reference));
        }

        public static DateTime StartOfBusinessYear(DateTime reference)
        {
            var businessDate = GetBusinessDate(reference);
            return new DateTime(businessDate.Year, 1, 1, 0, 0, 0, DateTimeKind.Unspecified);
        }

        public static DateTime StartOfBusinessYearUtc(DateTime reference)
        {
            return NormalizeClientDateTimeToUtc(StartOfBusinessYear(reference));
        }

        public static int GetBusinessDayOfWeek(DateTime value)
        {
            return (int)GetBusinessDate(value).DayOfWeek;
        }

        public static (int Year, int Month) GetBusinessYearMonth(DateTime value)
        {
            var businessDate = GetBusinessDate(value);
            return (businessDate.Year, businessDate.Month);
        }

        public static string FormatBusinessDate(DateTime value)
        {
            return ToBusinessDateTimeOffset(value).ToString("dd/MM/yyyy", PtBrCulture);
        }

        public static string FormatBusinessTime(DateTime value)
        {
            return ToBusinessDateTimeOffset(value).ToString("HH:mm", PtBrCulture);
        }

        public static DateTime CreateUtcDate(int year, int month, int day)
        {
            return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
        }

        public static DateTime StartOfWeekUtc(DateTime referenceUtc)
        {
            var utcReference = referenceUtc.Kind == DateTimeKind.Utc ? referenceUtc : referenceUtc.ToUniversalTime();
            var start = utcReference.Date.AddDays(-(int)utcReference.Date.DayOfWeek);
            return MarkAsUtc(start);
        }

        public static DateTime CreateUtcSlot(DateTime date, TimeSpan time)
        {
            return MarkAsUtc(date.Date.Add(time));
        }
    }
}
