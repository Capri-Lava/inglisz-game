// Słówka z podręcznika (rozdział „Człowiek”). Format: angielski | polski | kategoria | * = podkreślone / trudne
const WORDS_RAW = `
address|adres|dane
age|wiek|dane
citizen|obywatel|dane
citizenship|obywatelstwo|dane
date of birth|data urodzenia|dane
divorced|rozwiedziony|dane|*
educational background|wykształcenie|dane|*
female|kobieta, płeć żeńska|dane
first name|imię|dane
full name|imię i nazwisko|dane
job|zawód|dane
maiden name|nazwisko panieńskie|dane|*
male|mężczyzna, płeć męska|dane
marital status|stan cywilny|dane|*
married|żonaty, zamężna|dane
nationality|narodowość|dane
occupation|zawód|dane|*
place of birth|miejsce urodzenia|dane
profession|zawód|dane|*
separated|w separacji|dane|*
sex|płeć|dane
single|panna, kawaler|dane
surname|nazwisko|dane
widow|wdowa|dane|*
widower|wdowiec|dane|*
attractive|atrakcyjny, ładny|wyglad
average|przeciętny|wyglad|*
beautiful|piękny|wyglad
elegant|elegancki|wyglad
good-looking|atrakcyjny, ładny|wyglad
handsome|przystojny|wyglad
scruffy|niechlujny|wyglad|*
ugly|brzydki|wyglad
elderly|starszy (grzecznie)|wiek|*
middle-aged|w średnim wieku|wiek
old|stary|wiek
teenager|nastolatek|wiek
young|młody|wiek
bald|łysy|wlosy
curly|kręcony|wlosy
dark|ciemny|wlosy
fair|jasny|wlosy|*
ginger|rudy|wlosy|*
grey|siwy|wlosy
have a fringe|mieć grzywkę|wlosy|*
long|długi|wlosy
medium length|średniej długości|wlosy|*
short|krótki, niski|wlosy
straight|prosty|wlosy
thick|gęsty|wlosy
thin|cienki, rzadki, chudy|wlosy
wavy|falowany|wlosy
beard|broda, zarost|twarz
clean-shaven|gładko ogolony|twarz|*
ear|ucho|twarz
eye|oko|twarz
eyebrow|brew|twarz
face|twarz|twarz
freckle|pieg|twarz
pale|blady|twarz
tanned|opalony|twarz
arm|ramię|cialo
back|plecy|cialo
cheek|policzek|cialo
chest|klatka piersiowa|cialo|*
chin|broda|cialo|*
elbow|łokieć|cialo
eyelash|rzęsa|cialo
finger|palec u ręki|cialo
fingernail|paznokieć|cialo
fist|pięść|cialo
foot|stopa|cialo
forehead|czoło|cialo
hand|dłoń|cialo
head|głowa|cialo
heel|pięta|cialo
hip|biodro|cialo
knee|kolano|cialo
leg|noga|cialo
lips|wargi|cialo
mouth|usta|cialo
neck|szyja|cialo
nose|nos|cialo
shoulder|ramię|cialo
stomach|brzuch|cialo
throat|gardło|cialo
thumb|kciuk|cialo
toe|palec u nogi|cialo
tongue|język|cialo
tooth|ząb|cialo
athletic|wysportowany|budowa
average height|średniego wzrostu|budowa
fat|gruby|budowa
medium height|średniego wzrostu|budowa
overweight|otyły|budowa
skinny|bardzo chudy|budowa
slim|szczupły|budowa
tall|wysoki|budowa
well-built|dobrze zbudowany|budowa
bag|torba|ubrania
baggy|workowaty, luźny|ubrania
belt|pasek|ubrania
blouse|bluzka|ubrania
boots|buty zimowe|ubrania
bracelet|bransoletka|ubrania
briefcase|aktówka, teczka|ubrania
casual|codzienny|ubrania
chain|łańcuszek|ubrania
cheap|tani|ubrania
checked|w kratkę|ubrania
coat|płaszcz|ubrania
corduroy|sztruks|ubrania|*
cotton|bawełna, bawełniany|ubrania
denim|dżinsowy|ubrania
dress|sukienka|ubrania
earring|kolczyk|ubrania
expensive|drogi|ubrania
fashionable|modny|ubrania
flat shoes|buty na płaskim obcasie|ubrania
formal|elegancki, wyjściowy|ubrania
gloves|rękawiczki|ubrania
handbag|torebka|ubrania
hat|kapelusz, czapka|ubrania
high-heeled shoes|buty na wysokim obcasie|ubrania
jacket|marynarka, kurtka|ubrania
jeans|dżinsy|ubrania
jewellery|biżuteria|ubrania
leather|skóra, skórzany|ubrania
linen|len, lniany|ubrania|*
loose|luźny|ubrania|*
necklace|naszyjnik, kolia|ubrania
night dress|koszula nocna|ubrania|*
patterned|wzorzysty|ubrania|*
plain|gładki|ubrania|*
purse|portmonetka|ubrania
ring|pierścionek|ubrania
sandals|sandały|ubrania
scarf|szalik, apaszka|ubrania
shirt|koszula|ubrania
shoes|buty|ubrania
shorts|szorty, krótkie spodenki|ubrania
silk|jedwab, jedwabny|ubrania|*
sleeve|rękaw|ubrania|*
slipper|kapeć|ubrania
spotted|w kropki|ubrania|*
striped|w paski|ubrania
suede|zamsz, zamszowy|ubrania|*
suit|garnitur|ubrania
tie|krawat|ubrania
tight|obcisły, ciasny|ubrania|*
tights|rajstopy|ubrania|*
tracksuit|dres sportowy|ubrania|*
trainers|tenisówki|ubrania
trousers|spodnie|ubrania
T-shirt|podkoszulek|ubrania
umbrella|parasol|ubrania
wallet|portfel|ubrania
watch|zegarek na rękę|ubrania
wedding ring|obrączka|ubrania
wool|wełna|ubrania|*
woollen|wełniany|ubrania|*
absent-minded|roztargniony|charakter|*
accurate|dokładny|charakter|*
aggressive|agresywny|charakter
ambitious|ambitny|charakter
arrogant|arogancki|charakter
brave|odważny|charakter
calm|spokojny, opanowany|charakter
careless|niedbały|charakter
charming|czarujący|charakter|*
chatterbox|gaduła|charakter|*
cheeky|bezczelny|charakter|*
cheerful|pogodny, wesoły|charakter
clever|sprytny, mądry|charakter
conceited|zarozumiały|charakter|*
cruel|okrutny|charakter
disloyal|nielojalny|charakter
dishonest|nieuczciwy|charakter|*
friendly|przyjazny|charakter
unfriendly|nieprzyjazny|charakter
generous|szczodry, hojny|charakter|*
gentle|delikatny|charakter|*
gullible|łatwowierny|charakter|*
immature|niedojrzały|charakter
impatient|niecierpliwy|charakter
independent|niezależny|charakter|*
intelligent|inteligentny|charakter
jealous|zazdrosny|charakter
mature|dojrzały|charakter
mean|skąpy, złośliwy|charakter
modest|skromny|charakter|*
narrow-minded|ograniczony, nietolerancyjny|charakter|*
patient|cierpliwy|charakter
polite|grzeczny, uprzejmy|charakter
quiet|cichy|charakter
reliable|niezawodny, solidny|charakter|*
responsible|odpowiedzialny|charakter|*
rude|niegrzeczny|charakter
selfish|samolubny|charakter
shy|nieśmiały|charakter
sociable|towarzyski|charakter
strict|surowy, wymagający|charakter
stupid|głupi|charakter
talkative|gadatliwy, rozmowny|charakter
tolerant|tolerancyjny|charakter
admire|podziwiać|uczucia
adore|uwielbiać|uczucia|*
can't stand|nie móc znieść|uczucia
depression|depresja|uczucia
dislike|nie lubić|uczucia
faith|wiara|uczucia|*
fall in love|zakochać się|uczucia
fear|strach|uczucia
friendship|przyjaźń|uczucia
happiness|szczęście|uczucia
hate|nienawidzić|uczucia
hatred|nienawiść|uczucia|*
hope|nadzieja|uczucia|*
jealousy|zazdrość|uczucia
joy|radość|uczucia
like|lubić|uczucia
look down on|patrzeć z góry|uczucia
look up to|podziwiać|uczucia
love|kochać, uwielbiać, miłość|uczucia
respect|szanować, szacunek|uczucia
sadness|smutek|uczucia
shiver|dreszcz, drżenie|uczucia|*
worry|martwić się|uczucia
`;

// Pary celowo mylące (podobne słowa / „fałszywi przyjaciele”)
const CONFUSABLE = [
  ['tight','tights'],['widow','widower'],['generous','gentle'],['reliable','responsible'],
  ['chin','cheek','beard'],['wool','woollen'],['hate','hatred'],['jealous','jealousy'],
  ['mature','immature'],['patient','impatient'],['friendly','unfriendly'],['dishonest','disloyal'],
  ['admire','adore'],['look up to','look down on'],['fair','ginger','pale'],['plain','patterned'],
  ['spotted','striped','checked'],['suede','silk','linen','leather'],['sleeve','slipper'],
  ['purse','wallet','handbag'],['eyebrow','eyelash'],['finger','fingernail','thumb','toe'],
  ['heel','hip'],['conceited','charming'],['cheeky','cheerful'],['careless','accurate'],
  ['chatterbox','talkative'],['elderly','old'],['married','maiden name'],
  ['single','separated','divorced'],['occupation','nationality'],['clean-shaven','bald'],
  ['tracksuit','trainers','trousers'],['shirt','skirt','T-shirt','night dress'],
  ['modest','narrow-minded','gullible'],['independent','intelligent'],['faith','fear'],
  ['hope','joy'],['shiver','worry'],['average','average height'],['medium length','medium height'],
  ['have a fringe','curly','wavy'],['corduroy','denim','cotton'],['citizen','citizenship'],
  ['loose','baggy','tight'],['chest','stomach','back'],['shoulder','elbow','arm']
];

const WORDS = WORDS_RAW.trim().split('\n').map(l => {
  const [en, pl, cat, star] = l.split('|');
  return { en, pl, cat, star: star === '*' };
});
