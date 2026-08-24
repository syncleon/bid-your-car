package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import net.datafaker.Faker
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

data class RealCarModel(
    val year: Int,
    val make: String,
    val model: String,
    val engine: String,
    val drivetrain: String,
    val transmission: String,
    val bodyStyle: String,
    val exteriorColor: String,
    val interiorColor: String,
    val fuelType: String,
    val horsepower: Int,
    val description: String,
    val highlights: String,
    val knownFlaws: String,
    val mainImageUrl: String,
    val extraImageUrls: List<String>,
    val basePrice: BigDecimal
)

@Service
@Profile("!prod")
class ItemSeederService(
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository
) {
    private val faker = Faker()

    val exteriorUrlPool = listOf(
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1619362280286-f1f8fd5032ed?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80"
    )

    val interiorUrlPool = listOf(
        "https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80"
    )

    val engineUrlPool = listOf(
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80"
    )

    val serviceUrlPool = listOf(
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"
    )

    val realCarTemplates = listOf(
        RealCarModel(
            year = 2022,
            make = "Porsche",
            model = "911 GT3",
            engine = "4.0L Naturally Aspirated Flat-6",
            drivetrain = "RWD",
            transmission = "6-Speed Manual",
            bodyStyle = "Coupe",
            exteriorColor = "Shark Blue",
            interiorColor = "Black Leather",
            fuelType = "Gasoline",
            horsepower = 502,
            description = "This 2022 Porsche 911 GT3 is finished in Shark Blue over black leather and Race-Tex upholstery. Powered by a 4.0-liter flat-six paired with a six-speed manual transaxle and a mechanical limited-slip differential. Equipment includes the Chrono Package, carbon-fiber full bucket seats, Porsche Ceramic Composite Brakes (PCCB), a front-axle lift system, and LED headlights in black with PDLS.",
            highlights = "Clean Carfax report; 4.0L flat-six engine revving to 9,000 RPM; Carbon-fiber full bucket seats; PCCB Ceramic Brakes; Front-axle lift system.",
            knownFlaws = "Minor stone chips on front lower lip spoiler, otherwise in showroom condition.",
            mainImageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("210000")
        ),
        RealCarModel(
            year = 2021,
            make = "BMW",
            model = "M3 Competition",
            engine = "3.0L Twin-Turbocharged Inline-6",
            drivetrain = "RWD",
            transmission = "8-Speed Automatic",
            bodyStyle = "Sedan",
            exteriorColor = "Isle of Man Green",
            interiorColor = "Kyalami Orange",
            fuelType = "Gasoline",
            horsepower = 503,
            description = "Finished in Isle of Man Green over Kyalami Orange leather, this 2021 BMW M3 Competition features the M Carbon Exterior Package, M Carbon Bucket Seats, Executive Package, and 19\"/20\" M double-spoke wheels. Power comes from a twin-turbocharged 3.0L S58 inline-six linked with an eight-speed M Steptronic transmission.",
            highlights = "M Carbon Bucket Seats; M Driver's Package; Harman Kardon Surround Sound; M Sport Differential.",
            knownFlaws = "Light curb rash on right rear wheel.",
            mainImageUrl = "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("78000")
        ),
        RealCarModel(
            year = 2020,
            make = "Ford",
            model = "Mustang Shelby GT500",
            engine = "5.2L Supercharged V8",
            drivetrain = "RWD",
            transmission = "7-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Performance Blue",
            interiorColor = "Ebony Leather",
            fuelType = "Gasoline",
            horsepower = 760,
            description = "This 2020 Ford Mustang Shelby GT500 has 3,200 miles and is equipped with the Carbon Fiber Track Pack, which added 20\" exposed carbon-fiber wheels, a GT4-style carbon-fiber rear wing, adjustable strut top mounts, and Recaro seats. Power is provided by a supercharged 5.2-liter V8 mated to a Tremec seven-speed dual-clutch automatic transmission.",
            highlights = "Carbon Fiber Track Pack ($18,500 factory option); 760 HP supercharged V8; MagneRide Damping System; Technology Package.",
            knownFlaws = "None observed. Factory protective plastic still on door sills.",
            mainImageUrl = "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("95000")
        ),
        RealCarModel(
            year = 2023,
            make = "Chevrolet",
            model = "Corvette Z06",
            engine = "5.5L Flat-Plane Crank V8",
            drivetrain = "RWD",
            transmission = "8-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Torch Red",
            interiorColor = "Adrenaline Red",
            fuelType = "Gasoline",
            horsepower = 670,
            description = "This 2023 Chevrolet Corvette Z06 coupe is a 3LZ example powered by a 5.5-liter LT6 V8 driving the rear wheels through an eight-speed dual-clutch transaxle. Equipment includes the Z07 Performance Package, carbon-fiber ground effects, Brembo carbon-ceramic brakes, GT2 bucket seats, carbon-fiber interior trim, and front lift with memory.",
            highlights = "Z07 Performance Package; Carbon Ceramic Brakes; LT6 670 HP naturally-aspirated flat-plane V8; Front Axle Lift.",
            knownFlaws = "Delivery mileage only.",
            mainImageUrl = "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("145000")
        ),
        RealCarModel(
            year = 2021,
            make = "Audi",
            model = "R8 V10 Performance",
            engine = "5.2L Naturally Aspirated V10",
            drivetrain = "AWD",
            transmission = "7-Speed Dual-Clutch S-Tronic",
            bodyStyle = "Coupe",
            exteriorColor = "Mythos Black",
            interiorColor = "Black Nappa Leather",
            fuelType = "Gasoline",
            horsepower = 602,
            description = "This 2021 Audi R8 V10 Performance Quattro is powered by a 5.2-liter FSI V10 driving all four wheels through a seven-speed S-Tronic dual-clutch transaxle. Options include Mythos Black metallic paint, Carbon Exterior Package, sport exhaust system, Bang & Olufsen audio, and 20\" 5-double-spoke dynamic design forged wheels.",
            highlights = "Naturally aspirated 602 HP V10 engine; Carbon fiber sideblades and diffuser; Sport Exhaust; Bang & Olufsen sound.",
            knownFlaws = "Minor wear on driver seat outer bolster.",
            mainImageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("185000")
        ),
        RealCarModel(
            year = 2020,
            make = "Nissan",
            model = "GT-R Nismo",
            engine = "3.8L Twin-Turbocharged V6",
            drivetrain = "AWD",
            transmission = "6-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Pearl White",
            interiorColor = "Black & Red Suede",
            fuelType = "Gasoline",
            horsepower = 600,
            description = "This 2020 Nissan GT-R Nismo shows 4,100 miles and features GT3-spec turbochargers, carbon-fiber bodywork (roof, hood, fenders, and rear wing), Brembo carbon-ceramic brakes, lightweight RAYS 20\" forged wheels, and Bilstein DampTronic suspension.",
            highlights = "GT3-derived turbochargers; Carbon-fiber roof and body panels; Carbon Ceramic Brakes; Nismo tuned Bilstein suspension.",
            knownFlaws = "Clean record, full body paint protection film.",
            mainImageUrl = "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("190000")
        ),
        RealCarModel(
            year = 2021,
            make = "Mercedes-Benz",
            model = "AMG GT Black Series",
            engine = "4.0L Flat-Plane Twin-Turbo V8",
            drivetrain = "RWD",
            transmission = "7-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Solarbeam Yellow",
            interiorColor = "Black Leather & Suede",
            fuelType = "Gasoline",
            horsepower = 720,
            description = "This 2021 Mercedes-AMG GT Black Series is finished in AMG Magno Solarbeam Yellow over black leather and microfiber. Power is delivered by a flat-plane-crank twin-turbo 4.0-liter V8 mated to an AMG SPEEDSHIFT DCT seven-speed transmission. Features include two-stage carbon-fiber rear wing, carbon-fiber hood, roof, and front splitter, ceramic high-performance brakes, and Burmester surround sound.",
            highlights = "720 HP flat-plane V8; Active aerodynamics with two-piece carbon rear wing; Nürburgring lap record holder pedigree.",
            knownFlaws = "Stored in climate-controlled garage, like new condition.",
            mainImageUrl = "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("380000")
        ),
        RealCarModel(
            year = 2020,
            make = "Lamborghini",
            model = "Huracán EVO",
            engine = "5.2L Naturally Aspirated V10",
            drivetrain = "AWD",
            transmission = "7-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Arancio Borealis",
            interiorColor = "Nero Ade Leather",
            fuelType = "Gasoline",
            horsepower = 631,
            description = "Finished in Arancio Borealis pearl over Nero Ade leather, this 2020 Lamborghini Huracán EVO features rear-wheel steering, LDVI predictive vehicle dynamics, 20\" Aesir graphite wheels, carbon-ceramic brakes with orange calipers, sport exhaust, and transparent engine bonnet.",
            highlights = "631 HP 5.2L V10; Rear-wheel steering & torque vectoring; Lifting system; Carbon Ceramic Brakes.",
            knownFlaws = "Faint scratch on underside of front spoiler plastic.",
            mainImageUrl = "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("240000")
        ),
        RealCarModel(
            year = 2014,
            make = "Ferrari",
            model = "458 Italia",
            engine = "4.5L Naturally Aspirated V8",
            drivetrain = "RWD",
            transmission = "7-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Rosso Corsa",
            interiorColor = "Crema Leather",
            fuelType = "Gasoline",
            horsepower = 562,
            description = "This 2014 Ferrari 458 Italia has 8,500 miles and is powered by a mid-mounted 4.5-liter V8 paired with a seven-speed dual-clutch transaxle. Equipment includes Scuderia Ferrari fender shields, 20\" forged diamond wheels, carbon-fiber steering wheel with LED shift lights, Daytona-style seats, and carbon-ceramic brakes with yellow calipers.",
            highlights = "Last naturally aspirated V8 mid-engine Ferrari; Scuderia shields; Carbon LED steering wheel; Crema Daytona seats.",
            knownFlaws = "Normal minor seat bolster wear.",
            mainImageUrl = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("215000")
        ),
        RealCarModel(
            year = 2021,
            make = "Toyota",
            model = "GR Supra 3.0",
            engine = "3.0L Turbocharged Inline-6",
            drivetrain = "RWD",
            transmission = "8-Speed Automatic",
            bodyStyle = "Coupe",
            exteriorColor = "Renaissance Red",
            interiorColor = "Black Leather",
            fuelType = "Gasoline",
            horsepower = 382,
            description = "This 2021 Toyota GR Supra 3.0 Premium shows 9,400 miles and features a 382-hp turbocharged 3.0L inline-six, active rear differential, adaptive variable suspension, Brembo front brakes, JBL 12-speaker audio system, and full color Head-Up Display.",
            highlights = "382 HP B58 engine; Driver Assist Package; JBL 12-speaker premium audio; Head-Up Display.",
            knownFlaws = "Minor scuff on lower front bumper plastic.",
            mainImageUrl = "https://images.unsplash.com/photo-1619362280286-f1f8fd5032ed?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("46000")
        ),
        RealCarModel(
            year = 2021,
            make = "Dodge",
            model = "Challenger SRT Hellcat",
            engine = "6.2L Supercharged HEMI V8",
            drivetrain = "RWD",
            transmission = "8-Speed Automatic",
            bodyStyle = "Coupe",
            exteriorColor = "Pitch Black",
            interiorColor = "Black Laguna Leather",
            fuelType = "Gasoline",
            horsepower = 797,
            description = "Powered by a supercharged 6.2-liter high-output HEMI V8 producing 797 horsepower, this 2021 Redeye Widebody comes equipped with 305-section Pirelli P-Zero tires, Competition Suspension, SRT Power Chiller, Harman Kardon 18-speaker audio, and Brembo six-piston front calipers.",
            highlights = "797 HP Supercharged Redeye HEMI; Widebody Package; SRT Power Chiller; TorqueFlite 8-speed.",
            knownFlaws = "Tire wear consistent with 6,000 miles.",
            mainImageUrl = "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("82000")
        ),
        RealCarModel(
            year = 2015,
            make = "Subaru",
            model = "WRX STI",
            engine = "2.5L Turbocharged Boxer-4",
            drivetrain = "AWD",
            transmission = "6-Speed Manual",
            bodyStyle = "Sedan",
            exteriorColor = "WR Blue Pearl",
            interiorColor = "Black Alcantara",
            fuelType = "Gasoline",
            horsepower = 305,
            description = "Number 142 of 1,000 Launch Edition models produced for North America. Finished in iconic WR Blue Pearl over black Alcantara with gold 18\" BBS forged wheels, STI short-throw shifter, Keyless Access with Push Button Start, and Driver Controlled Center Differential (DCCD).",
            highlights = "#142 of 1,000 Launch Edition; Original 18\" Gold BBS wheels; Stock EJ257 engine with no aftermarket mods; Clean title.",
            knownFlaws = "Small stone chip on hood.",
            mainImageUrl = "https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1619362280286-f1f8fd5032ed?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("32000")
        ),
        RealCarModel(
            year = 2022,
            make = "Mazda",
            model = "MX-5 Miata RF",
            engine = "2.0L SkyActiv-G Inline-4",
            drivetrain = "RWD",
            transmission = "6-Speed Manual",
            bodyStyle = "Convertible",
            exteriorColor = "Soul Red Crystal",
            interiorColor = "Black Cloth",
            fuelType = "Gasoline",
            horsepower = 181,
            description = "This 2022 Mazda MX-5 Miata RF Club is equipped with the Brembo/BBS/Recaro Package, featuring red Brembo front calipers, 17\" dark gunmetal BBS forged wheels, heated Recaro sport seats, Bilstein dampers, and a limited-slip differential.",
            highlights = "Brembo / BBS / Recaro Package ($4,500 factory option); Retractable Fastback power hardtop; Bilstein dampers.",
            knownFlaws = "Mint condition.",
            mainImageUrl = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("34000")
        ),
        RealCarModel(
            year = 2019,
            make = "Aston Martin",
            model = "Vantage",
            engine = "4.0L Twin-Turbo V8",
            drivetrain = "RWD",
            transmission = "8-Speed Automatic",
            bodyStyle = "Coupe",
            exteriorColor = "Lime Essence",
            interiorColor = "Black Leather",
            fuelType = "Gasoline",
            horsepower = 503,
            description = "Finished in head-turning Lime Essence, this 2019 Aston Martin Vantage features an AMG-sourced 4.0-liter twin-turbo V8, rear E-Diff, quad exhaust tailpipes, Tech Collection, Sports Plus Collection, and 20\" forged textured dark wheels.",
            highlights = "Lime Essence signature color; Sports Plus seats & steering wheel; Aston Martin quad exhaust; 3.6-sec 0-60 MPH.",
            knownFlaws = "None observed.",
            mainImageUrl = "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("115000")
        ),
        RealCarModel(
            year = 2018,
            make = "McLaren",
            model = "720S",
            engine = "4.0L Twin-Turbocharged V8",
            drivetrain = "RWD",
            transmission = "7-Speed Dual-Clutch",
            bodyStyle = "Coupe",
            exteriorColor = "Azores Orange",
            interiorColor = "Black Alcantara",
            fuelType = "Gasoline",
            horsepower = 710,
            description = "This 2018 McLaren 720S Performance coupe has 6,800 miles and features Azores Orange paint over carbon-fiber Monocage II chassis architecture. Options include Carbon Fiber Exterior Packs 1 & 2, Sports Exhaust, 10-spoke super-lightweight forged wheels, vehicle lift, and Bowers & Wilkins 12-speaker audio system.",
            highlights = "Carbon Monocage II tub; 710 HP twin-turbo V8; Proactive Chassis Control II; B&W 12-speaker audio.",
            knownFlaws = "Clean Carfax, PPF applied to full vehicle.",
            mainImageUrl = "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("235000")
        ),
        RealCarModel(
            year = 2022,
            make = "Land Rover",
            model = "Defender 110",
            engine = "5.0L Supercharged V8",
            drivetrain = "4WD",
            transmission = "8-Speed Automatic",
            bodyStyle = "SUV",
            exteriorColor = "Carpathian Grey",
            interiorColor = "Ebony Windsor Leather",
            fuelType = "Gasoline",
            horsepower = 518,
            description = "This 2022 Land Rover Defender 110 V8 is powered by a supercharged 5.0L V8 mated to an eight-speed automatic transmission and twin-speed transfer box. Features include quad exhaust outlets, 22\" Style 5098 satin dark grey wheels, Electronic Air Suspension, Meridian Surround Sound System, and head-up display.",
            highlights = "518 HP Supercharged V8; Carpathian Exterior Pack; Electronic Active Differential; Meridian Surround Sound.",
            knownFlaws = "Minor clear-coat scratch near rear tailgate badge.",
            mainImageUrl = "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("98000")
        ),
        RealCarModel(
            year = 2022,
            make = "Tesla",
            model = "Model S Plaid",
            engine = "Tri-Motor Electric Drive",
            drivetrain = "AWD",
            transmission = "Single-Speed",
            bodyStyle = "Sedan",
            exteriorColor = "Ultra Red",
            interiorColor = "White & Black Premium",
            fuelType = "Electric",
            horsepower = 1020,
            description = "This 2022 Tesla Model S Plaid is finished in Ultra Red over a white leather interior with carbon fiber accents. Features a tri-motor setup producing 1,020 hp, Yoke steering wheel, 21\" Arachnid wheels, Full Self-Driving capability (paid in full), and 17\" center tilt display.",
            highlights = "1,020 HP tri-motor AWD; 0-60 MPH in 1.99s; FSD Beta active; 21\" Arachnid Wheels.",
            knownFlaws = "None observed.",
            mainImageUrl = "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("89000")
        ),
        RealCarModel(
            year = 1969,
            make = "Chevrolet",
            model = "Camaro SS",
            engine = "6.5L Turbo-Jet 396 V8",
            drivetrain = "RWD",
            transmission = "4-Speed Manual",
            bodyStyle = "Coupe",
            exteriorColor = "Hugger Orange",
            interiorColor = "Black Houndstooth",
            fuelType = "Gasoline",
            horsepower = 375,
            description = "This iconic 1969 Chevrolet Camaro SS 396 underwent a comprehensive frame-off restoration. Powered by a L78 396ci V8 factory rated at 375 hp backed by a Muncie 4-speed manual transmission and 12-bolt Posi-traction rear end. Features cowl induction hood, power front disc brakes, and rally wheels.",
            highlights = "Frame-off nut-and-bolt restoration; Matching numbers L78 396ci V8; Muncie 4-speed manual; Cowl Induction.",
            knownFlaws = "Engine bay restored to factory correct detail.",
            mainImageUrl = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("75000")
        ),
        RealCarModel(
            year = 1967,
            make = "Shelby",
            model = "Cobra 427 S/C",
            engine = "7.0L FE 427 V8",
            drivetrain = "RWD",
            transmission = "4-Speed Manual",
            bodyStyle = "Convertible",
            exteriorColor = "Guardsman Blue",
            interiorColor = "Black Leather",
            fuelType = "Gasoline",
            horsepower = 485,
            description = "This Shelby CSX4000 series 427 S/C Cobra features an aluminum body finished in Guardsman Blue with Wimbledon White stripes. Powered by a Shelby 427ci FE V8 engine fitted with aluminum heads, dual Holley four-barrel carburetors, Toploader four-speed manual transmission, and side pipes.",
            highlights = "Shelby CSX official continuation aluminum body; 427 FE V8 with dual carbs; Halibrand knock-off wheels; Side-exit pipes.",
            knownFlaws = "Immense exhaust rumble.",
            mainImageUrl = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("175000")
        ),
        RealCarModel(
            year = 2020,
            make = "Alfa Romeo",
            model = "Giulia Quadrifoglio",
            engine = "2.9L Twin-Turbo V6",
            drivetrain = "RWD",
            transmission = "8-Speed Automatic",
            bodyStyle = "Sedan",
            exteriorColor = "Rosso Competizione",
            interiorColor = "Black Leather",
            fuelType = "Gasoline",
            horsepower = 505,
            description = "This 2020 Alfa Romeo Giulia Quadrifoglio has 12,000 miles and features a 505-hp 2.9-liter twin-turbo V6 engineered with Ferrari input. Options include active aero front splitter, carbon-fiber hood and roof, Sparco carbon-fiber seat backs, active suspension, and carbon-ceramic brakes.",
            highlights = "Ferrari-derived 505 HP twin-turbo V6; Active carbon front splitter; Sparco carbon-back bucket seats.",
            knownFlaws = "Clean title, minor wear on lower front chin splitter.",
            mainImageUrl = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
            extraImageUrls = listOf(
                "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80"
            ),
            basePrice = BigDecimal("58000")
        )
    )

    @Transactional
    fun seedItems(count: Int) {
        val users = userRepository.findAll()
        if (users.isEmpty()) {
            throw IllegalStateException("No users found. Please seed users first.")
        }

        val items = (0 until count).map { index ->
            val template = realCarTemplates[index % realCarTemplates.size]
            val seller = users.random()

            var vin = faker.vehicle().vin()
            if (itemRepository.existsByVin(vin)) {
                vin = UUID.randomUUID().toString().replace("-", "").take(17).uppercase()
            }

            val item = Item(
                seller = seller,
                status = ItemStatus.DRAFT,
                year = template.year,
                make = template.make,
                model = template.model,
                vin = vin,
                location = "${faker.address().city()}, ${faker.address().stateAbbr()}",
                mileage = faker.number().numberBetween(1200, 35000),
                description = template.description,
                engine = template.engine,
                drivetrain = template.drivetrain,
                transmission = template.transmission,
                bodyStyle = template.bodyStyle,
                exteriorColor = template.exteriorColor.take(30),
                interiorColor = template.interiorColor.take(30),
                fuelType = template.fuelType.take(30),
                horsepower = template.horsepower,
                condition = ConditionGrade.EXCELLENT,
                sellerType = if (faker.bool().bool()) "Private" else "Dealer",
                highlights = template.highlights,
                knownFlaws = template.knownFlaws,
                reservePrice = template.basePrice,
                isNoReserve = (index % 4 == 0)
            )

            // Exactly 50 images per item:
            // Image #1 (sortOrder 0): MAIN hero image
            val mainImage = ItemImage(
                url = "${template.mainImageUrl}&img=0",
                category = ImageCategory.MAIN,
                sortOrder = 0,
                item = item
            )
            item.addImage(mainImage)

            // Images #2 to #26 (sortOrder 1 to 25): EXTERIOR
            for (i in 1..25) {
                val poolUrl = exteriorUrlPool[(i - 1 + index) % exteriorUrlPool.size]
                val extImage = ItemImage(
                    url = "$poolUrl&img=$i",
                    category = ImageCategory.EXTERIOR,
                    sortOrder = i,
                    item = item
                )
                item.addImage(extImage)
            }

            // Images #27 to #40 (sortOrder 26 to 39): INTERIOR
            for (i in 26..39) {
                val poolUrl = interiorUrlPool[(i - 26 + index) % interiorUrlPool.size]
                val intImage = ItemImage(
                    url = "$poolUrl&img=$i",
                    category = ImageCategory.INTERIOR,
                    sortOrder = i,
                    item = item
                )
                item.addImage(intImage)
            }

            // Images #41 to #45 (sortOrder 40 to 44): ENGINE
            for (i in 40..44) {
                val poolUrl = engineUrlPool[(i - 40 + index) % engineUrlPool.size]
                val engImage = ItemImage(
                    url = "$poolUrl&img=$i",
                    category = ImageCategory.ENGINE,
                    sortOrder = i,
                    item = item
                )
                item.addImage(engImage)
            }

            // Images #46 to #48 (sortOrder 45 to 47): SERVICE
            for (i in 45..47) {
                val poolUrl = serviceUrlPool[(i - 45 + index) % serviceUrlPool.size]
                val srvImage = ItemImage(
                    url = "$poolUrl&img=$i",
                    category = ImageCategory.SERVICE,
                    sortOrder = i,
                    item = item
                )
                item.addImage(srvImage)
            }

            // Images #49 to #50 (sortOrder 48 to 49): OTHER
            for (i in 48..49) {
                val poolUrl = serviceUrlPool[(i - 45 + index) % serviceUrlPool.size]
                val othImage = ItemImage(
                    url = "$poolUrl&img=$i",
                    category = ImageCategory.OTHER,
                    sortOrder = i,
                    item = item
                )
                item.addImage(othImage)
            }

            item
        }

        itemRepository.saveAll(items)
    }
}